// ============================================================
// 文件作用：文章表格扩展（保留用户设置的宽度与对齐）
// 功能对应：ArticleEditor 插入表格、详情页表格渲染
// 维护指引：
//   - 列/行拖拽后总宽高 → lib/articleTableDimension.js
//   - 行高拖拽 → lib/articleTableRowResize.js
// ============================================================

import { Table, TableView } from "@tiptap/extension-table";
import {
  createTableDimensionSyncPlugin,
  parseStyleWidth,
  readTableScrollWidth,
  resolveTableDimensions,
  TABLE_LAYOUT_BUFFER_PX,
} from "@/lib/articleTableDimension";
import { createRowResizingPlugin } from "@/lib/articleTableRowResize";

/**
 * 按文档数据刷新表格在编辑器中的整体宽高
 * @param {import('@tiptap/extension-table').TableView} view
 * @param {import('@tiptap/pm/model').Node} node
 */
function applyArticleTableLayout(view, node) {
  const align = node.attrs.dataTableAlign || "center";
  const cellMinWidth = view.cellMinWidth || 25;
  const { width, height } = resolveTableDimensions(node, cellMinWidth);
  const styleWidth = parseStyleWidth(node.attrs.style);
  const documentWidth = Math.max(width, styleWidth);

  view.dom.style.maxWidth = "100%";
  view.dom.style.marginTop = "";
  view.dom.style.marginBottom = "";
  view.dom.style.height = "";
  view.dom.style.minHeight = "";
  view.dom.style.overflowX = "visible";
  view.dom.style.overflowY = "visible";

  if (documentWidth > 0) {
    view.table.style.tableLayout = "fixed";
    view.table.style.minWidth = "";
    view.table.style.maxWidth = "none";
    view.table.style.width = `${documentWidth}px`;

    // 展示层略宽于文档宽度，防止右边框被裁切；不写回文档，避免无限变宽
    const scrollWidth = readTableScrollWidth(view.table);
    const wrapperWidth =
      scrollWidth > documentWidth
        ? scrollWidth + TABLE_LAYOUT_BUFFER_PX
        : documentWidth;

    view.dom.style.width = `${wrapperWidth}px`;
    view.table.style.width = `${documentWidth}px`;
  } else {
    view.dom.style.width = "";
    view.table.style.width = "";
    view.table.style.tableLayout = "";
  }

  if (height > 0) {
    view.table.style.height = `${height}px`;
    view.table.style.minHeight = "";
  } else {
    view.table.style.height = "";
    view.table.style.minHeight = "";
  }

  view.dom.style.marginLeft = "";
  view.dom.style.marginRight = "";

  if (align === "center") {
    view.dom.style.marginLeft = "auto";
    view.dom.style.marginRight = "auto";
  } else if (align === "right") {
    view.dom.style.marginLeft = "auto";
    view.dom.style.marginRight = "0";
  } else if (align === "left") {
    view.dom.style.marginLeft = "0";
    view.dom.style.marginRight = "auto";
  }
}

class ArticleTableView extends TableView {
  constructor(node, cellMinWidth, view, HTMLAttributes = {}) {
    super(node, cellMinWidth, view, {
      class: "article-editor-table",
      ...HTMLAttributes,
    });
    applyArticleTableLayout(this, node);
  }

  update(node) {
    const ok = super.update(node);
    if (ok) {
      applyArticleTableLayout(this, node);
    }
    return ok;
  }
}

export const ArticleTable = Table.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      View: ArticleTableView,
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute("style"),
        renderHTML: (attributes) => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
      dataTableAlign: {
        default: "center",
        parseHTML: (element) =>
          element.getAttribute("data-table-align") || "center",
        renderHTML: (attributes) => ({
          "data-table-align": attributes.dataTableAlign || "center",
        }),
      },
      border: {
        default: 1,
        parseHTML: (element) => element.getAttribute("border"),
        renderHTML: (attributes) => {
          if (attributes.border == null || attributes.border === "") {
            return {};
          }
          return { border: attributes.border };
        },
      },
      cellspacing: {
        default: 1,
        parseHTML: (element) => element.getAttribute("cellspacing"),
        renderHTML: (attributes) => {
          if (attributes.cellspacing == null || attributes.cellspacing === "") {
            return {};
          }
          return { cellspacing: attributes.cellspacing };
        },
      },
      cellpadding: {
        default: 1,
        parseHTML: (element) => element.getAttribute("cellpadding"),
        renderHTML: (attributes) => {
          if (attributes.cellpadding == null || attributes.cellpadding === "") {
            return {};
          }
          return { cellpadding: attributes.cellpadding };
        },
      },
      summary: {
        default: null,
        parseHTML: (element) => element.getAttribute("summary"),
        renderHTML: (attributes) => {
          if (!attributes.summary) return {};
          return { summary: attributes.summary };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    const parentPlugins = this.parent?.() ?? [];
    const canResize = this.options.resizable && this.editor.isEditable;
    if (!canResize) return parentPlugins;

    const cellMinWidth = this.options.cellMinWidth ?? 25;

    return [
      ...parentPlugins,
      createRowResizingPlugin({ handleHeight: this.options.handleWidth ?? 6 }),
      createTableDimensionSyncPlugin({ cellMinWidth }),
    ];
  },
});
