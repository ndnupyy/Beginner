// ============================================================
// 文件作用：编辑器表格插入工具
// 功能对应：ArticleEditor 工具栏「表格」按钮
// ============================================================

export const TABLE_HEADER_OPTIONS = [
  { value: "none", label: "无" },
  { value: "row", label: "首行" },
  { value: "col", label: "首列" },
];

export const TABLE_ALIGN_OPTIONS = [
  { value: "", label: "<没有设置>" },
  { value: "left", label: "左对齐" },
  { value: "center", label: "居中对齐" },
  { value: "right", label: "右对齐" },
];

export const DEFAULT_TABLE_OPTIONS = {
  rows: 3,
  cols: 2,
  width: 500,
  height: "",
  headerType: "none",
  cellspacing: 1,
  border: 1,
  cellpadding: 1,
  align: "",
  caption: "",
  summary: "",
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(text) {
  return String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function clampNumber(value, min, max, fallback) {
  const num = Number.parseInt(String(value), 10);
  if (Number.isNaN(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function buildTableStyle({ width, height }) {
  const parts = [];

  if (width) {
    parts.push(`width:${width}px`);
  }
  if (height) {
    parts.push(`height:${height}px`);
  }

  return parts.join(";");
}

function buildCellHtml(tag) {
  return `<${tag}><p></p></${tag}>`;
}

function buildTableHtml(rawOptions) {
  const options = {
    ...DEFAULT_TABLE_OPTIONS,
    ...rawOptions,
  };

  const rows = clampNumber(options.rows, 1, 30, 3);
  const cols = clampNumber(options.cols, 1, 10, 2);
  const width = options.width ? clampNumber(options.width, 100, 2000, 500) : "";
  const height = options.height
    ? clampNumber(options.height, 40, 2000, "")
    : "";
  const border = clampNumber(options.border, 0, 10, 1);
  const cellspacing = clampNumber(options.cellspacing, 0, 20, 1);
  const cellpadding = clampNumber(options.cellpadding, 0, 40, 1);
  const headerType = options.headerType || "none";
  const align = options.align || "";
  const effectiveAlign = align || "center";
  const caption = (options.caption || "").trim();
  const summary = (options.summary || "").trim();

  const style = buildTableStyle({ width, height });
  const attrs = [
    'class="article-editor-table"',
    style ? `style="${escapeAttr(style)}"` : "",
    `data-table-align="${effectiveAlign}"`,
    `border="${border}"`,
    `cellspacing="${cellspacing}"`,
    `cellpadding="${cellpadding}"`,
    summary ? `summary="${escapeAttr(summary)}"` : "",
  ]
    .filter(Boolean)
    .join(" ");

  let html = "";

  if (caption) {
    html += `<div class="article-table-caption">${escapeHtml(caption)}</div>`;
  }

  html += `<table ${attrs}>`;

  if (headerType === "row") {
    html += "<thead><tr>";
    for (let col = 0; col < cols; col += 1) {
      html += buildCellHtml("th");
    }
    html += "</tr></thead><tbody>";
    for (let row = 1; row < rows; row += 1) {
      html += "<tr>";
      for (let col = 0; col < cols; col += 1) {
        html += buildCellHtml("td");
      }
      html += "</tr>";
    }
    html += "</tbody>";
  } else {
    html += "<tbody>";
    for (let row = 0; row < rows; row += 1) {
      html += "<tr>";
      for (let col = 0; col < cols; col += 1) {
        const tag =
          headerType === "col" && col === 0 ? "th" : "td";
        html += buildCellHtml(tag);
      }
      html += "</tr>";
    }
    html += "</tbody>";
  }

  html += "</table><p></p>";
  return html;
}

/** 向编辑器插入表格（整段 HTML 一次插入，标题由 tableCaption 扩展解析） */
export function insertEditorTable(editor, options) {
  if (!editor) return false;

  return editor.chain().focus().insertContent(buildTableHtml(options)).run();
}

/** 从 DOM 元素定位表格在文档中的起始位置 */
export function getTablePosFromView(view, element) {
  if (!view || !element || !view.dom.contains(element)) return null;

  try {
    let current = element.closest?.("table") || element;

    while (current && current !== view.dom) {
      const pos = view.posAtDOM(current, 0);
      const $pos = view.state.doc.resolve(pos);

      for (let depth = $pos.depth; depth >= 0; depth -= 1) {
        if ($pos.node(depth).type.name === "table") {
          return $pos.before(depth);
        }
      }

      current = current.parentElement;
    }
  } catch {
    return null;
  }

  return null;
}

/** 读取表格纯文本 */
export function getTableInfo(editor, pos) {
  if (!editor) return null;

  const node = editor.state.doc.nodeAt(pos);
  if (!node || node.type.name !== "table") return null;

  return {
    pos,
    text: node.textContent,
    nodeSize: node.nodeSize,
  };
}

/** 删除表格 */
export function deleteTableAtPos(editor, pos) {
  if (!editor) return false;

  const node = editor.state.doc.nodeAt(pos);
  if (!node || node.type.name !== "table") return false;

  return editor
    .chain()
    .focus()
    .deleteRange({ from: pos, to: pos + node.nodeSize })
    .run();
}

/** 复制表格文本 */
export async function copyTableText(editor, pos) {
  const info = getTableInfo(editor, pos);
  if (!info) return false;

  try {
    await navigator.clipboard.writeText(info.text);
    return true;
  } catch {
    return false;
  }
}

/** 剪切表格 */
export async function cutTable(editor, pos) {
  const copied = await copyTableText(editor, pos);
  if (!copied) return false;
  return deleteTableAtPos(editor, pos);
}
