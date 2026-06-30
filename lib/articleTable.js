// ============================================================
// 文件作用：文章表格扩展（保留用户设置的宽度与对齐）
// 功能对应：ArticleEditor 插入表格、详情页表格渲染
// ============================================================

import { Table, TableView } from "@tiptap/extension-table";

function parseWidthFromStyle(style) {
  if (!style) return null;
  const match = String(style).match(/\bwidth\s*:\s*(\d+(?:\.\d+)?)\s*px/i);
  return match ? `${match[1]}px` : null;
}

function applyArticleTableLayout(view, node) {
  const width = parseWidthFromStyle(node.attrs.style);
  const align = node.attrs.dataTableAlign || "center";

  view.dom.style.maxWidth = "100%";
  view.dom.style.marginTop = "";
  view.dom.style.marginBottom = "";

  if (width) {
    view.dom.style.width = width;
    view.table.style.width = "100%";
    view.table.style.minWidth = "";
    view.table.style.tableLayout = "fixed";
  } else {
    view.dom.style.width = "";
    view.table.style.tableLayout = "";
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
  constructor(node, cellMinWidth, view, HTMLAttributes) {
    super(node, cellMinWidth, view, HTMLAttributes);
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
});
