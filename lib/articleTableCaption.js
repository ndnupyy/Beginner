// ============================================================
// 文件作用：表格标题节点（不受段落对齐工具影响）
// 功能对应：ArticleEditor 插入表格时的标题
// ============================================================

import { Node } from "@tiptap/core";

export const ArticleTableCaption = Node.create({
  name: "tableCaption",
  group: "block",
  content: "inline*",
  defining: true,

  parseHTML() {
    return [
      { tag: "div.article-table-caption", priority: 60 },
      { tag: "p.article-table-caption", priority: 60 },
    ];
  },

  renderHTML() {
    return ["div", { class: "article-table-caption" }, 0];
  },
});
