// ============================================================
// 文件作用：文章内容格式工具（TipTap HTML / 旧纯文本兼容）
// 功能对应：编辑器初始内容、详情页渲染、字数统计
// ============================================================

import DOMPurify from "isomorphic-dompurify";

export function looksLikeHtml(content) {
  if (!content) return false;
  return /<[a-z][\s\S]*>/i.test(content.trim());
}

/** 纯文本旧文章 → TipTap 可加载的 HTML */
export function toEditorHtml(content) {
  if (!content) return "";
  if (looksLikeHtml(content)) return content;

  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .split("\n")
    .map((line) => `<p>${line || "<br>"}</p>`)
    .join("");
}

/** 从 HTML 或纯文本提取可见字数 */
export function getContentPlainText(content) {
  if (!content) return "";
  if (!looksLikeHtml(content)) return content;

  return content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n+/g, "\n")
    .trim();
}

export function getContentTextLength(content) {
  return getContentPlainText(content).replace(/\s/g, "").length;
}

/** 详情页安全渲染 HTML */
export function sanitizeArticleHtml(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "h1",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "a",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "td",
      "th",
      "caption",
      "div",
    ],
    ALLOWED_ATTR: [
      "href",
      "target",
      "rel",
      "class",
      "data-language",
      "src",
      "alt",
      "title",
      "width",
      "height",
      "style",
      "border",
      "cellspacing",
      "cellpadding",
      "summary",
      "colspan",
      "rowspan",
      "data-table-align",
    ],
  });
}

/** 详情页最终 HTML（兼容旧纯文本） */
export function toArticleBodyHtml(content) {
  if (!content) return "";
  if (looksLikeHtml(content)) {
    return sanitizeArticleHtml(content);
  }

  const escaped = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .split("\n")
    .map((line) => `<p>${line || "<br>"}</p>`)
    .join("");
}
