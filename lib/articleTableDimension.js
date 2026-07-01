// ============================================================
// 文件作用：表格总体宽高计算与文档同步
// 功能对应：列/行拖拽后更新表格整体 width、height
// 维护指引：
//   - 列宽拖拽 → lib/articleTable.js（TipTap resizable）
//   - 行高拖拽 → lib/articleTableRowResize.js
// ============================================================

import { Plugin, PluginKey } from "@tiptap/pm/state";

export const TABLE_LAYOUT_BUFFER_PX = 1;

/**
 * 读取表格 DOM 实际内容宽度（不写回文档，仅用于展示对齐）
 * @param {HTMLTableElement | null | undefined} tableEl
 * @returns {number}
 */
export function readTableScrollWidth(tableEl) {
  if (!tableEl) return 0;
  return Math.ceil(
    Math.max(
      tableEl.scrollWidth || 0,
      tableEl.offsetWidth || 0,
      tableEl.getBoundingClientRect().width || 0
    )
  );
}

/**
 * 从 style 字符串读取 width（像素）
 * @param {string | null | undefined} style
 * @returns {number}
 */
export function parseStyleWidth(style) {
  if (!style) return 0;
  const match = String(style).match(/\bwidth\s*:\s*(\d+(?:\.\d+)?)\s*px/i);
  return match ? Math.round(Number(match[1])) : 0;
}

/**
 * 从 style 字符串读取 height（像素）
 * @param {string | null | undefined} style
 * @returns {number}
 */
export function parseStyleHeight(style) {
  if (!style) return 0;
  const match = String(style).match(/\bheight\s*:\s*(\d+(?:\.\d+)?)\s*px/i);
  return match ? Math.round(Number(match[1])) : 0;
}

/**
 * 根据首行列宽属性求表格总宽
 * @param {import('@tiptap/pm/model').Node} tableNode
 * @param {number} cellMinWidth
 * @returns {{ total: number, hasExplicit: boolean }}
 */
export function sumColumnWidths(tableNode, cellMinWidth = 25) {
  const firstRow = tableNode.firstChild;
  if (!firstRow) return { total: 0, hasExplicit: false };

  let total = 0;
  let hasExplicit = false;

  firstRow.forEach((cell) => {
    const colspan = cell.attrs.colspan || 1;
    const colwidth = cell.attrs.colwidth;

    if (colwidth?.length) {
      for (let index = 0; index < colspan; index += 1) {
        const width = colwidth[index];
        if (width) {
          total += width;
          hasExplicit = true;
        } else {
          total += cellMinWidth;
        }
      }
      return;
    }

    total += cellMinWidth * colspan;
  });

  return { total, hasExplicit };
}

/**
 * 根据各行 rowheight 求表格总高
 * @param {import('@tiptap/pm/model').Node} tableNode
 * @param {number} fallbackRowHeight - 未单独设高的行使用的默认行高
 * @returns {{ total: number, hasExplicit: boolean }}
 */
export function sumRowHeights(tableNode, fallbackRowHeight = 32) {
  let total = 0;
  let hasExplicit = false;

  tableNode.forEach((row) => {
    if (row.attrs.rowheight) {
      total += Number(row.attrs.rowheight);
      hasExplicit = true;
      return;
    }
    total += fallbackRowHeight;
  });

  return { total, hasExplicit };
}

/**
 * 替换 style 中的 width / height，保留其它样式
 * @param {string | null | undefined} style
 * @param {{ width?: number, height?: number }} sizes
 * @returns {string | null}
 */
export function patchTableStyleSize(style, { width, height }) {
  let next = String(style || "")
    .replace(/\bwidth\s*:\s*[^;]+;?/gi, "")
    .replace(/\bheight\s*:\s*[^;]+;?/gi, "")
    .replace(/\bmin-width\s*:\s*[^;]+;?/gi, "")
    .replace(/\bmin-height\s*:\s*[^;]+;?/gi, "")
    .trim();

  const parts = next ? [next.replace(/;+\s*$/, "")] : [];

  if (width && width > 0) {
    parts.push(`width:${width}px`);
  }
  if (height && height > 0) {
    parts.push(`height:${height}px`);
  }

  const merged = parts.filter(Boolean).join(";");
  return merged || null;
}

/**
 * 计算编辑器中表格应呈现的整体宽高
 * @param {import('@tiptap/pm/model').Node} tableNode
 * @param {number} cellMinWidth
 * @returns {{ width: number, height: number }}
 */
export function resolveTableDimensions(tableNode, cellMinWidth = 25) {
  const styleWidth = parseStyleWidth(tableNode.attrs.style);
  const styleHeight = parseStyleHeight(tableNode.attrs.style);
  const rowCount = tableNode.childCount || 1;
  const perRowFallback =
    styleHeight > 0 ? Math.round(styleHeight / rowCount) : 32;
  const { total: columnTotal, hasExplicit: hasColumnWidths } = sumColumnWidths(
    tableNode,
    cellMinWidth
  );
  const { total: rowTotal, hasExplicit: hasRowHeights } = sumRowHeights(
    tableNode,
    perRowFallback
  );

  return {
    width: hasColumnWidths ? columnTotal : styleWidth,
    height: hasRowHeights ? rowTotal : styleHeight,
  };
}

/**
 * 判断文档变更是否涉及表格列宽/行高（仅此时才同步总宽高，避免打字时无限变宽）
 * @param {import('@tiptap/pm/model').Node} oldDoc
 * @param {import('@tiptap/pm/model').Node} newDoc
 * @returns {boolean}
 */
function tableStructureSizesChanged(oldDoc, newDoc) {
  const snapshot = (doc) => {
    let parts = "";
    doc.descendants((node) => {
      if (node.type.name === "tableRow" && node.attrs.rowheight) {
        parts += `r:${node.attrs.rowheight};`;
      }
      if (
        (node.type.name === "tableCell" || node.type.name === "tableHeader") &&
        node.attrs.colwidth
      ) {
        parts += `c:${node.attrs.colwidth.join(",")};`;
      }
    });
    return parts;
  };
  return snapshot(oldDoc) !== snapshot(newDoc);
}

/**
 * 列/行拖拽后，把实际总宽高写回 table 节点 style
 * @param {import('@tiptap/pm/state').EditorState} state
 * @param {number} cellMinWidth
 * @returns {import('@tiptap/pm/state').Transaction | null}
 */
export function createTableDimensionSyncTransaction(state, cellMinWidth = 25) {
  let tr = state.tr;
  let changed = false;

  state.doc.descendants((node, pos) => {
    if (node.type.name !== "table") return;

    const styleWidth = parseStyleWidth(node.attrs.style);
    const styleHeight = parseStyleHeight(node.attrs.style);
    const rowCount = node.childCount || 1;
    const perRowFallback =
      styleHeight > 0 ? Math.round(styleHeight / rowCount) : 32;
    const { total: columnTotal, hasExplicit: hasColumnWidths } = sumColumnWidths(
      node,
      cellMinWidth
    );
    const { total: rowTotal, hasExplicit: hasRowHeights } = sumRowHeights(
      node,
      perRowFallback
    );

    const nextWidth = hasColumnWidths ? columnTotal : styleWidth;
    const nextHeight = hasRowHeights ? rowTotal : styleHeight;

    if (nextWidth === styleWidth && nextHeight === styleHeight) return;

    const nextStyle = patchTableStyleSize(node.attrs.style, {
      width: nextWidth || undefined,
      height: nextHeight || undefined,
    });

    if (nextStyle === (node.attrs.style || null)) return;

    tr = tr.setNodeMarkup(pos, null, {
      ...node.attrs,
      style: nextStyle,
    });
    changed = true;
  });

  return changed ? tr : null;
}

/**
 * 拖拽改行列后同步表格总体宽高
 * @param {{ cellMinWidth?: number }} [options]
 * @returns {import('@tiptap/pm/state').Plugin}
 */
export function createTableDimensionSyncPlugin({ cellMinWidth = 25 } = {}) {
  return new Plugin({
    key: new PluginKey("articleTableDimensionSync"),
    appendTransaction(transactions, oldState, newState) {
      if (!transactions.some((tr) => tr.docChanged)) return null;
      if (!tableStructureSizesChanged(oldState.doc, newState.doc)) return null;
      return createTableDimensionSyncTransaction(newState, cellMinWidth);
    },
  });
}
