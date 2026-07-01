// ============================================================
// 文件作用：文章表格行扩展（支持行高持久化）
// 功能对应：ArticleEditor 表格行拖拽调整高度
// 维护指引：
//   - 行高拖拽逻辑 → lib/articleTableRowResize.js
//   - 详情页行高样式 → app/globals.css
// ============================================================

import { TableRow } from "@tiptap/extension-table";

/**
 * 从 tr 的 style 中解析行高（像素）
 * @param {string | null | undefined} style
 * @returns {number | null}
 */
function parseRowHeightFromStyle(style) {
  if (!style) return null;
  const match = String(style).match(/\bheight\s*:\s*(\d+(?:\.\d+)?)\s*px/i);
  return match ? Math.round(Number(match[1])) : null;
}

export const ArticleTableRow = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      rowheight: {
        default: null,
        parseHTML: (element) => parseRowHeightFromStyle(element.getAttribute("style")),
        renderHTML: (attributes) => {
          if (!attributes.rowheight) return {};
          return { style: `height: ${attributes.rowheight}px` };
        },
      },
    };
  },
});
