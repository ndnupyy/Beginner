// ============================================================
// 文件作用：表格行高拖拽调整（ProseMirror 插件）
// 功能对应：ArticleEditor 表格底部边缘拖动改变整行高度
// 维护指引：
//   - 行高属性定义 → lib/articleTableRow.js
//   - 列宽拖拽 → lib/articleTable.js（TipTap resizable）
// ============================================================

import { Plugin, PluginKey } from "@tiptap/pm/state";

/** 行高拖拽插件状态键 */
export const rowResizingPluginKey = new PluginKey("articleTableRowResizing");

/** 行高下限（像素） */
const DEFAULT_ROW_MIN_HEIGHT = 32;

/** 当前高亮的表格行 DOM */
let activeRowElement = null;

/**
 * 清除行高亮样式
 */
function clearActiveRowElement() {
  if (!activeRowElement) return;
  activeRowElement.classList.remove("row-resize-active", "row-resize-dragging");
  activeRowElement = null;
}

/**
 * 高亮可拖拽的表格行
 * @param {HTMLElement | null} rowEl
 * @param {boolean} [dragging]
 */
function setActiveRowElement(rowEl, dragging = false) {
  clearActiveRowElement();
  if (!rowEl) return;
  activeRowElement = rowEl;
  activeRowElement.classList.add(dragging ? "row-resize-dragging" : "row-resize-active");
}

/**
 * 行高拖拽状态
 */
class RowResizeState {
  /**
   * @param {number} activeHandle - 当前行在文档中的起始位置，-1 表示无
   * @param {{ startY: number, startHeight: number, cellDOM: HTMLElement } | null} dragging
   */
  constructor(activeHandle, dragging) {
    this.activeHandle = activeHandle;
    this.dragging = dragging;
  }

  /**
   * @param {import('@tiptap/pm/state').Transaction} tr
   * @returns {RowResizeState}
   */
  apply(tr) {
    const action = tr.getMeta(rowResizingPluginKey);
    if (action && action.setHandle != null) {
      return new RowResizeState(action.setHandle, null);
    }
    if (action && action.setDragging !== undefined) {
      return new RowResizeState(this.activeHandle, action.setDragging);
    }
    if (this.activeHandle > -1 && tr.docChanged) {
      let handle = tr.mapping.map(this.activeHandle, -1);
      const node = tr.doc.nodeAt(handle);
      if (!node || node.type.name !== "tableRow") handle = -1;
      return new RowResizeState(handle, this.dragging);
    }
    return this;
  }
}

/**
 * 从 DOM 向上查找 td/th
 * @param {EventTarget | null} target
 * @returns {HTMLTableCellElement | null}
 */
function domCellAround(target) {
  let el = target;
  while (el && el.nodeName !== "TD" && el.nodeName !== "TH") {
    if (el.classList?.contains("ProseMirror")) return null;
    el = el.parentNode;
  }
  return el;
}

/**
 * 根据单元格 DOM 定位表格行在文档中的位置
 * @param {import('@tiptap/pm/view').EditorView} view
 * @param {HTMLElement} cellDOM
 * @returns {number}
 */
function getRowPosFromCellDOM(view, cellDOM) {
  try {
    const pos = view.posAtDOM(cellDOM, 0);
    const $pos = view.state.doc.resolve(pos);
    for (let depth = $pos.depth; depth > 0; depth -= 1) {
      if ($pos.node(depth).type.name === "tableRow") {
        return $pos.before(depth);
      }
    }
  } catch {
    return -1;
  }
  return -1;
}

/**
 * 读取当前行高
 * @param {import('@tiptap/pm/view').EditorView} view
 * @param {number} rowPos
 * @param {Record<string, unknown>} rowAttrs
 * @param {HTMLElement | null} cellDOM
 * @returns {number}
 */
function currentRowHeight(view, rowPos, rowAttrs, cellDOM) {
  if (rowAttrs.rowheight) return Number(rowAttrs.rowheight);
  const rowEl = cellDOM?.closest("tr");
  if (rowEl) return rowEl.getBoundingClientRect().height;
  const rowNode = view.state.doc.nodeAt(rowPos);
  if (!rowNode) return DEFAULT_ROW_MIN_HEIGHT;
  return DEFAULT_ROW_MIN_HEIGHT;
}

/**
 * 拖动过程中临时设置行高（仅 DOM，不写文档）
 * @param {HTMLElement | null} cellDOM
 * @param {number} height
 */
function displayRowHeight(cellDOM, height) {
  const rowEl = cellDOM?.closest("tr");
  if (!rowEl) return;
  const px = `${height}px`;
  rowEl.style.height = px;
  rowEl.querySelectorAll("td, th").forEach((cell) => {
    cell.style.height = px;
  });
}

/**
 * 清除拖动时写入的内联高度，交由文档属性重新渲染
 * @param {HTMLElement | null} cellDOM
 */
function clearDisplayedRowHeight(cellDOM) {
  const rowEl = cellDOM?.closest("tr");
  if (!rowEl) return;
  rowEl.style.height = "";
  rowEl.querySelectorAll("td, th").forEach((cell) => {
    cell.style.height = "";
  });
}

/**
 * 将行高写入文档
 * @param {import('@tiptap/pm/view').EditorView} view
 * @param {number} rowPos
 * @param {number} height
 */
function updateRowHeight(view, rowPos, height) {
  const row = view.state.doc.nodeAt(rowPos);
  if (!row || row.type.name !== "tableRow") return;
  const nextHeight = Math.max(DEFAULT_ROW_MIN_HEIGHT, Math.round(height));
  const tr = view.state.tr.setNodeMarkup(rowPos, null, {
    ...row.attrs,
    rowheight: nextHeight,
  });
  view.dispatch(tr);
}

/**
 * 更新当前激活的行手柄
 * @param {import('@tiptap/pm/view').EditorView} view
 * @param {number} value
 * @param {HTMLElement | null} [rowEl]
 */
function updateRowHandle(view, value, rowEl = null) {
  if (value === -1) {
    clearActiveRowElement();
  } else {
    setActiveRowElement(rowEl);
  }
  view.dispatch(view.state.tr.setMeta(rowResizingPluginKey, { setHandle: value }));
}

/**
 * 鼠标是否靠近单元格底边
 * @param {MouseEvent} event
 * @param {HTMLElement} cellDOM
 * @param {number} handleHeight
 * @returns {boolean}
 */
function isNearRowBottom(event, cellDOM, handleHeight) {
  const { bottom } = cellDOM.getBoundingClientRect();
  return bottom - event.clientY <= handleHeight;
}

/**
 * 根据拖动距离计算新行高
 * @param {{ startY: number, startHeight: number }} dragging
 * @param {MouseEvent} event
 * @returns {number}
 */
function draggedRowHeight(dragging, event) {
  const offset = event.clientY - dragging.startY;
  return Math.max(DEFAULT_ROW_MIN_HEIGHT, dragging.startHeight + offset);
}

/**
 * 创建表格行高拖拽插件
 * @param {{ handleHeight?: number, rowMinHeight?: number }} [options]
 * @returns {Plugin}
 */
export function createRowResizingPlugin({ handleHeight = 6 } = {}) {
  return new Plugin({
    key: rowResizingPluginKey,
    state: {
      init() {
        return new RowResizeState(-1, null);
      },
      apply(tr, prev) {
        return prev.apply(tr);
      },
    },
    props: {
      attributes(state) {
        const pluginState = rowResizingPluginKey.getState(state);
        if (pluginState?.activeHandle > -1) {
          return { class: "row-resize-cursor" };
        }
        return {};
      },
      handleDOMEvents: {
        mousemove(view, event) {
          if (!view.editable) return false;
          const pluginState = rowResizingPluginKey.getState(view.state);
          if (!pluginState || pluginState.dragging) return false;

          const cellDOM = domCellAround(event.target);
          let rowPos = -1;
          let rowEl = null;
          if (cellDOM && isNearRowBottom(event, cellDOM, handleHeight)) {
            rowPos = getRowPosFromCellDOM(view, cellDOM);
            rowEl = cellDOM.closest("tr");
          }

          if (rowPos !== pluginState.activeHandle) {
            updateRowHandle(view, rowPos, rowEl);
          }
          return false;
        },
        mouseleave(view) {
          if (!view.editable) return false;
          const pluginState = rowResizingPluginKey.getState(view.state);
          if (pluginState?.activeHandle > -1 && !pluginState.dragging) {
            updateRowHandle(view, -1);
          }
          return false;
        },
        mousedown(view, event) {
          if (!view.editable) return false;
          const win = view.dom.ownerDocument.defaultView || window;
          const pluginState = rowResizingPluginKey.getState(view.state);
          if (!pluginState || pluginState.activeHandle === -1 || pluginState.dragging) {
            return false;
          }

          const cellDOM = domCellAround(event.target);
          if (!cellDOM || !isNearRowBottom(event, cellDOM, handleHeight)) {
            return false;
          }

          const rowPos = pluginState.activeHandle;
          const row = view.state.doc.nodeAt(rowPos);
          if (!row) return false;

          const startHeight = currentRowHeight(view, rowPos, row.attrs, cellDOM);
          const rowEl = cellDOM.closest("tr");
          setActiveRowElement(rowEl, true);
          view.dispatch(
            view.state.tr.setMeta(rowResizingPluginKey, {
              setDragging: { startY: event.clientY, startHeight, cellDOM },
            })
          );

          function finish(finishEvent) {
            win.removeEventListener("mouseup", finish);
            win.removeEventListener("mousemove", move);
            const latest = rowResizingPluginKey.getState(view.state);
            if (latest?.dragging) {
              updateRowHeight(view, rowPos, draggedRowHeight(latest.dragging, finishEvent));
              clearDisplayedRowHeight(latest.dragging.cellDOM);
              clearActiveRowElement();
              view.dispatch(view.state.tr.setMeta(rowResizingPluginKey, { setDragging: null }));
            }
          }

          function move(moveEvent) {
            if (!moveEvent.buttons) return finish(moveEvent);
            const latest = rowResizingPluginKey.getState(view.state);
            if (!latest?.dragging) return;
            displayRowHeight(
              latest.dragging.cellDOM,
              draggedRowHeight(latest.dragging, moveEvent)
            );
          }

          displayRowHeight(cellDOM, startHeight);
          win.addEventListener("mouseup", finish);
          win.addEventListener("mousemove", move);
          event.preventDefault();
          return true;
        },
      },
      decorations() {
        return null;
      },
    },
  });
}
