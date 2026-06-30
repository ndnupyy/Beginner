// ============================================================
// 文件作用：编辑器段落对齐工具
// 功能对应：ArticleEditor 工具栏「对齐」下拉
// ============================================================

export const ALIGN_OPTIONS = [
  { value: "left", label: "左对齐" },
  { value: "center", label: "居中对齐" },
  { value: "right", label: "右对齐" },
  { value: "justify", label: "两端对齐" },
];

export function getActiveTextAlign(editor) {
  if (!editor) return "left";

  for (const option of ALIGN_OPTIONS) {
    if (editor.isActive({ textAlign: option.value })) {
      return option.value;
    }
  }

  return "left";
}

export function isTextAlignActive(editor) {
  if (!editor) return false;
  return getActiveTextAlign(editor) !== "left";
}

export function applyTextAlign(editor, alignment) {
  if (!editor) return;
  editor.chain().focus().setTextAlign(alignment).run();
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(text) {
  return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/** 插入或更新链接 */
export function insertEditorLink(editor, url, text) {
  if (!editor) return false;

  let href = url.trim();
  if (!href) return false;

  if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) {
    href = `https://${href}`;
  }

  const label = text.trim() || href;
  const { from, to, empty } = editor.state.selection;
  const linkHtml = `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;

  if (!empty && !text.trim()) {
    return editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href, target: "_blank", rel: "noopener noreferrer" })
      .run();
  }

  if (!empty) {
    return editor.chain().focus().insertContentAt({ from, to }, linkHtml).run();
  }

  return editor.chain().focus().insertContent(linkHtml).run();
}

/** 打开链接弹窗时的初始值 */
export function getLinkModalInitial(editor) {
  if (!editor) {
    return { url: "", text: "" };
  }

  const { from, to, empty } = editor.state.selection;
  const linkAttrs = editor.getAttributes("link");
  const selectedText = empty
    ? ""
    : editor.state.doc.textBetween(from, to, " ");

  return {
    url: linkAttrs.href || "",
    text: selectedText || linkAttrs.href || "",
  };
}

/** 上传本地图片并返回 URL */
export async function uploadArticleImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/articles/upload-image", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "图片上传失败");
  }

  return data.imageUrl;
}

/** 向编辑器插入图片 */
export function insertEditorImage(editor, src, alt = "") {
  if (!editor || !src) return false;

  return editor
    .chain()
    .focus()
    .setImage({ src, alt: alt || undefined })
    .run();
}
