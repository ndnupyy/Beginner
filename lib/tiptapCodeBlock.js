// ============================================================
// 文件作用：TipTap 代码块扩展（带 language 属性，块级只读）
// 功能对应：ArticleEditor 插入代码
// ============================================================

import { mergeAttributes } from "@tiptap/core";
import CodeBlock from "@tiptap/extension-code-block";
import { NodeSelection, Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { ReplaceAroundStep, ReplaceStep } from "@tiptap/pm/transform";

export const CODE_BLOCK_ALLOW_META = "allowCodeBlockChange";

function isInCodeBlock($pos) {
  for (let depth = $pos.depth; depth >= 0; depth -= 1) {
    if ($pos.node(depth).type.name === "codeBlock") return true;
  }
  return false;
}

function getCodeBlockPosFromResolved($pos) {
  for (let depth = $pos.depth; depth >= 0; depth -= 1) {
    if ($pos.node(depth).type.name === "codeBlock") {
      return $pos.before(depth);
    }
  }
  return null;
}

function stepTouchesCodeBlockInner(step, doc) {
  if (!(step instanceof ReplaceStep || step instanceof ReplaceAroundStep)) {
    return false;
  }

  if (!doc?.content) return false;

  const from = Math.max(0, Math.min(step.from, doc.content.size));
  const to = Math.max(from, Math.min(step.to, doc.content.size));

  let touchesInner = false;

  doc.nodesBetween(from, to, (node, pos) => {
    if (!node?.type || node.type.name !== "codeBlock") return;

    const innerFrom = pos + 1;
    const innerTo = pos + node.nodeSize - 1;
    const replacesWholeNode =
      step.from <= pos && step.to >= pos + node.nodeSize;

    if (
      !replacesWholeNode &&
      step.from < innerTo &&
      step.to > innerFrom
    ) {
      touchesInner = true;
    }
  });

  return touchesInner;
}

function transactionTouchesCodeBlockInner(tr, state) {
  let doc = state.doc;

  for (const step of tr.steps) {
    if (stepTouchesCodeBlockInner(step, doc)) {
      return true;
    }

    const result = step.apply(doc);
    if (result.failed) break;
    doc = result.doc;
  }

  return false;
}

function createCodeBlockGuardPlugin() {
  return new Plugin({
    key: new PluginKey("codeBlockGuard"),
    filterTransaction(tr, state) {
      if (tr.getMeta(CODE_BLOCK_ALLOW_META)) return true;
      if (!tr.docChanged) return true;

      return !transactionTouchesCodeBlockInner(tr, state);
    },
    props: {
      handleTextInput(view, from) {
        return isInCodeBlock(view.state.doc.resolve(from));
      },
      handlePaste(view) {
        const { selection } = view.state;
        if (
          selection instanceof TextSelection &&
          isInCodeBlock(selection.$from)
        ) {
          return true;
        }
        return false;
      },
      handleKeyDown(view, event) {
        const { state } = view;
        const { selection } = state;

        if (!(selection instanceof TextSelection)) return false;
        if (!isInCodeBlock(selection.$from)) return false;

        const blockPos = getCodeBlockPosFromResolved(selection.$from);
        if (blockPos == null) return false;

        if (event.key === "Backspace" || event.key === "Delete") {
          const node = state.doc.nodeAt(blockPos);
          if (!node) return true;
          view.dispatch(state.tr.delete(blockPos, blockPos + node.nodeSize));
          return true;
        }

        view.dispatch(
          state.tr.setSelection(NodeSelection.create(state.doc, blockPos))
        );
        event.preventDefault();
        return true;
      },
    },
  });
}

export const ArticleCodeBlock = CodeBlock.extend({
  selectable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      language: {
        default: "plaintext",
        parseHTML: (element) =>
          element.getAttribute("data-language") || "plaintext",
        renderHTML: (attributes) => ({
          "data-language": attributes.language,
          class: `article-code-block language-${attributes.language}`,
          title: "双击编辑代码",
        }),
      },
    };
  },

  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const dom = document.createElement("pre");
      const code = document.createElement("code");
      const attrs = mergeAttributes(HTMLAttributes, {
        "data-language": node.attrs.language,
        class: `article-code-block language-${node.attrs.language}`,
        title: "双击编辑代码",
        contenteditable: "false",
      });

      Object.entries(attrs).forEach(([key, value]) => {
        if (value != null && value !== false) {
          dom.setAttribute(key, value === true ? "" : String(value));
        }
      });

      code.textContent = node.textContent;
      dom.appendChild(code);

      dom.addEventListener("mousedown", (event) => {
        if (event.button !== 0 || event.detail > 1) return;

        event.preventDefault();
        const pos = getPos();
        if (typeof pos !== "number") return;

        editor.commands.setNodeSelection(pos);
      });

      return {
        dom,
        contentDOM: null,
        update(updatedNode) {
          if (updatedNode.type.name !== "codeBlock") return false;

          code.textContent = updatedNode.textContent;
          dom.setAttribute("data-language", updatedNode.attrs.language);
          dom.className = `article-code-block language-${updatedNode.attrs.language}`;
          return true;
        },
        ignoreMutation: () => true,
        selectNode() {
          dom.classList.add("ProseMirror-selectednode");
        },
        deselectNode() {
          dom.classList.remove("ProseMirror-selectednode");
        },
        stopEvent(event) {
          if (event.type === "dblclick" || event.type === "contextmenu") {
            return false;
          }
          if (event.type === "mousedown") return true;
          return false;
        },
      };
    };
  },

  addProseMirrorPlugins() {
    return [createCodeBlockGuardPlugin()];
  },
});

export const CODE_LANGUAGES = [
  { value: "plaintext", label: "Plain Text" },
  { value: "bash", label: "Bash" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "css", label: "CSS/SCSS/LESS" },
  { value: "dart", label: "Dart" },
  { value: "delphi", label: "Delphi" },
  { value: "diff", label: "diff" },
  { value: "vbnet", label: "VB.NET" },
  { value: "go", label: "Go" },
  { value: "html", label: "HTML" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "kotlin", label: "Kotlin" },
  { value: "objectivec", label: "Objective-C" },
  { value: "perl", label: "Perl" },
  { value: "php", label: "PHP" },
  { value: "python", label: "Python" },
  { value: "ruby", label: "Ruby" },
  { value: "sql", label: "SQL" },
  { value: "vbscript", label: "VBScript" },
  { value: "swift", label: "Swift" },
  { value: "erlang", label: "Erlang" },
  { value: "scala", label: "Scala" },
];

function normalizeCode(code) {
  return (code || "").replace(/\r\n/g, "\n");
}

/** 从 DOM 元素定位代码块在文档中的起始位置 */
export function getCodeBlockPosFromView(view, element) {
  if (!view || !element) return null;

  try {
    const pos = view.posAtDOM(element, 0);
    const $pos = view.state.doc.resolve(pos);

    for (let depth = $pos.depth; depth >= 0; depth -= 1) {
      const node = $pos.node(depth);
      if (node.type.name === "codeBlock") {
        return $pos.before(depth);
      }
    }
  } catch {
    return null;
  }

  return null;
}

/** 读取代码块内容与语言 */
export function getCodeBlockInfo(editor, pos) {
  if (!editor) return null;

  const node = editor.state.doc.nodeAt(pos);
  if (!node || node.type.name !== "codeBlock") return null;

  return {
    pos,
    code: node.textContent,
    language: node.attrs.language || "plaintext",
    nodeSize: node.nodeSize,
  };
}

/** 向编辑器插入代码块 */
export function insertCodeBlock(editor, code, language) {
  if (!editor) return;

  const text = normalizeCode(code);

  editor
    .chain()
    .focus()
    .insertContent([
      {
        type: "codeBlock",
        attrs: { language: language || "plaintext" },
        content: text ? [{ type: "text", text }] : [],
      },
      { type: "paragraph" },
    ])
    .run();
}

/** 更新已有代码块 */
export function updateCodeBlockAtPos(editor, pos, code, language) {
  if (!editor) return false;

  const node = editor.state.doc.nodeAt(pos);
  if (!node || node.type.name !== "codeBlock") return false;

  const text = normalizeCode(code);
  const contentFrom = pos + 1;
  const contentTo = pos + node.nodeSize - 1;

  return editor
    .chain()
    .focus()
    .command(({ tr, dispatch, state }) => {
      if (!dispatch) return true;

      tr.setMeta(CODE_BLOCK_ALLOW_META, true);

      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        language: language || "plaintext",
      });

      const textNode = text ? state.schema.text(text) : null;
      if (textNode) {
        tr.replaceWith(contentFrom, contentTo, textNode);
      } else if (contentTo > contentFrom) {
        tr.delete(contentFrom, contentTo);
      }

      dispatch(tr);
      return true;
    })
    .run();
}

/** 删除代码块 */
export function deleteCodeBlockAtPos(editor, pos) {
  if (!editor) return false;

  const node = editor.state.doc.nodeAt(pos);
  if (!node || node.type.name !== "codeBlock") return false;

  return editor
    .chain()
    .focus()
    .deleteRange({ from: pos, to: pos + node.nodeSize })
    .run();
}

/** 复制代码块文本到剪贴板 */
export async function copyCodeBlockText(editor, pos) {
  const info = getCodeBlockInfo(editor, pos);
  if (!info) return false;

  try {
    await navigator.clipboard.writeText(info.code);
    return true;
  } catch {
    return false;
  }
}

/** 剪切代码块 */
export async function cutCodeBlock(editor, pos) {
  const copied = await copyCodeBlockText(editor, pos);
  if (!copied) return false;
  return deleteCodeBlockAtPos(editor, pos);
}

/** 粘贴到代码块（替换内容） */
export async function pasteIntoCodeBlock(editor, pos) {
  const info = getCodeBlockInfo(editor, pos);
  if (!info) return false;

  try {
    const text = await navigator.clipboard.readText();
    return updateCodeBlockAtPos(editor, pos, text, info.language);
  } catch {
    return false;
  }
}
