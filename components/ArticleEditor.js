"use client";
// ============================================================
// 文件作用：TipTap 富文本编辑器
// 功能对应：写文章、编辑文章正文
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import {
  TableCell,
  TableHeader,
} from "@tiptap/extension-table";
import { ArticleTable } from "@/lib/articleTable";
import { ArticleTableRow } from "@/lib/articleTableRow";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";
import { toEditorHtml } from "@/lib/contentFormat";
import { applyListType, isListTypeActive } from "@/lib/editorList";
import {
  ALIGN_OPTIONS,
  applyTextAlign,
  getActiveTextAlign,
  getLinkModalInitial,
  insertEditorImage,
  insertEditorLink,
  isTextAlignActive,
  uploadArticleImage,
} from "@/lib/editorToolbar";
import {
  ArticleCodeBlock,
  copyCodeBlockText,
  cutCodeBlock,
  deleteCodeBlockAtPos,
  getCodeBlockInfo,
  getCodeBlockPosFromView,
  insertCodeBlock,
  pasteIntoCodeBlock,
  updateCodeBlockAtPos,
} from "@/lib/tiptapCodeBlock";
import { ArticleTableCaption } from "@/lib/articleTableCaption";
import {
  DEFAULT_TABLE_OPTIONS,
  cutTable,
  copyTableText,
  deleteTableAtPos,
  getTablePosFromView,
  insertEditorTable,
} from "@/lib/editorTable";
import { usePinnedEditorToolbar } from "@/lib/usePinnedEditorToolbar";
import CodeBlockContextMenu from "@/components/CodeBlockContextMenu";
import CodeInsertModal from "@/components/CodeInsertModal";
import LinkInsertModal from "@/components/LinkInsertModal";
import TableInsertModal from "@/components/TableInsertModal";
import "./ArticleEditor.css";

const DEFAULT_CODE_MODAL = { code: "", language: "javascript" };
const DEFAULT_LINK_MODAL = { url: "", text: "" };

function ListIcon({ type }) {
  if (type === "ordered") {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M2.5 4.5h2v1H3.5v1h1.5M3 11.5h1.5L3 13.5h2M3.5 16.5v-2h1.5"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M7 5h10M7 10h10M7 15h10" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="3.5" cy="5" r="1.2" fill="currentColor" />
      <circle cx="3.5" cy="10" r="1.2" fill="currentColor" />
      <circle cx="3.5" cy="15" r="1.2" fill="currentColor" />
      <path d="M7 5h10M7 10h10M7 15h10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function AlignIcon({ type }) {
  const lines = {
    left: [5, 7, 15, 11],
    center: [8, 10, 12, 11],
    right: [5, 9, 13, 11],
    justify: [5, 7, 15, 15],
  };
  const widths = lines[type] || lines.left;

  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {widths.map((width, index) => {
        const y = 5 + index * 3.5;
        let x = 3.5;
        if (type === "center") x = (20 - width) / 2;
        if (type === "right") x = 20 - width - 3.5;
        return (
          <path
            key={index}
            d={`M${x} ${y}H${x + width}`}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function useToolbarDropdown() {
  const [openKey, setOpenKey] = useState(null);
  const refs = useRef({});

  useEffect(() => {
    if (!openKey) return;

    function handleClickOutside(event) {
      const container = refs.current[openKey];
      if (container && !container.contains(event.target)) {
        setOpenKey(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openKey]);

  return {
    openKey,
    setOpenKey,
    refs,
  };
}

function EditorToolbar({
  editor,
  onOpenCodeModal,
  onOpenLinkModal,
  onOpenTableModal,
  onPickImage,
  imageUploading,
}) {
  const { openKey, setOpenKey, refs } = useToolbarDropdown();

  if (!editor) return null;

  const listActive =
    isListTypeActive(editor, "bullet") || isListTypeActive(editor, "ordered");
  const alignActive = isTextAlignActive(editor);
  const activeAlign = getActiveTextAlign(editor);

  return (
    <div className="editor-toolbar">
      <button
        type="button"
        className="editor-toolbar-btn"
        title="撤销"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        ↶
      </button>
      <button
        type="button"
        className="editor-toolbar-btn"
        title="重做"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        ↷
      </button>

      <span className="editor-toolbar-divider" aria-hidden="true" />

      <button
        type="button"
        className={`editor-toolbar-btn editor-toolbar-btn-text${
          editor.isActive("bold") ? " is-active" : ""
        }`}
        title="加粗"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </button>

      <div
        className="editor-toolbar-dropdown"
        ref={(node) => {
          refs.current.list = node;
        }}
      >
        <button
          type="button"
          className={`editor-toolbar-list-trigger${
            openKey === "list" || listActive ? " is-active" : ""
          }`}
          title="列表"
          onClick={() =>
            setOpenKey((key) => (key === "list" ? null : "list"))
          }
          aria-expanded={openKey === "list"}
        >
          列表
          <span
            className={`editor-toolbar-list-arrow${
              openKey === "list" ? " is-open" : ""
            }`}
            aria-hidden="true"
          >
            ▼
          </span>
        </button>
        {openKey === "list" && (
          <div className="editor-toolbar-menu">
            <button
              type="button"
              className={`editor-toolbar-menu-item${
                isListTypeActive(editor, "ordered") ? " is-active" : ""
              }`}
              onClick={() => {
                applyListType(editor, "ordered");
                setOpenKey(null);
              }}
            >
              <span className="editor-toolbar-menu-icon">
                <ListIcon type="ordered" />
              </span>
              <span className="editor-toolbar-menu-label">有序列表</span>
              {isListTypeActive(editor, "ordered") && (
                <span className="editor-toolbar-menu-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
            <button
              type="button"
              className={`editor-toolbar-menu-item${
                isListTypeActive(editor, "bullet") ? " is-active" : ""
              }`}
              onClick={() => {
                applyListType(editor, "bullet");
                setOpenKey(null);
              }}
            >
              <span className="editor-toolbar-menu-icon">
                <ListIcon type="bullet" />
              </span>
              <span className="editor-toolbar-menu-label">无序列表</span>
              {isListTypeActive(editor, "bullet") && (
                <span className="editor-toolbar-menu-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      <div
        className="editor-toolbar-dropdown"
        ref={(node) => {
          refs.current.align = node;
        }}
      >
        <button
          type="button"
          className={`editor-toolbar-list-trigger${
            openKey === "align" || alignActive ? " is-active" : ""
          }`}
          title="对齐"
          onClick={() =>
            setOpenKey((key) => (key === "align" ? null : "align"))
          }
          aria-expanded={openKey === "align"}
        >
          对齐
          <span
            className={`editor-toolbar-list-arrow${
              openKey === "align" ? " is-open" : ""
            }`}
            aria-hidden="true"
          >
            ▼
          </span>
        </button>
        {openKey === "align" && (
          <div className="editor-toolbar-menu">
            {ALIGN_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`editor-toolbar-menu-item${
                  activeAlign === option.value ? " is-active" : ""
                }`}
                onClick={() => {
                  applyTextAlign(editor, option.value);
                  setOpenKey(null);
                }}
              >
                <span className="editor-toolbar-menu-icon">
                  <AlignIcon type={option.value} />
                </span>
                <span className="editor-toolbar-menu-label">{option.label}</span>
                {activeAlign === option.value && (
                  <span className="editor-toolbar-menu-check" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <span className="editor-toolbar-divider" aria-hidden="true" />

      <button
        type="button"
        className="editor-toolbar-btn editor-toolbar-btn-divider"
        title="分隔线"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <span className="editor-toolbar-divider-icon" aria-hidden="true" />
      </button>

      <button
        type="button"
        className={`editor-toolbar-btn${
          editor.isActive("codeBlock") ? " is-active" : ""
        }`}
        title="代码"
        onClick={onOpenCodeModal}
      >
        {"</>"}
      </button>

      <button
        type="button"
        className="editor-toolbar-btn"
        title={imageUploading ? "图片上传中..." : "图片"}
        disabled={imageUploading}
        onClick={onPickImage}
      >
        🖼
      </button>

      <button
        type="button"
        className={`editor-toolbar-btn${
          editor.isActive("link") ? " is-active" : ""
        }`}
        title="链接"
        onClick={onOpenLinkModal}
      >
        🔗
      </button>

      <button
        type="button"
        className={`editor-toolbar-btn${
          editor.isActive("table") ? " is-active" : ""
        }`}
        title="表格"
        onClick={onOpenTableModal}
      >
        ▦
      </button>
    </div>
  );
}

export default function ArticleEditor({
  title: controlledTitle,
  content: controlledContent,
  onTitleChange,
  onContentChange,
  embedded = false,
  showToolbar = false,
  hideTitle = false,
  toolbarAnchorRef = null,
}) {
  const [internalTitle, setInternalTitle] = useState("");
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [codeModalInitial, setCodeModalInitial] = useState(DEFAULT_CODE_MODAL);
  const [codeModalKey, setCodeModalKey] = useState(0);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkModalInitial, setLinkModalInitial] = useState(DEFAULT_LINK_MODAL);
  const [linkModalKey, setLinkModalKey] = useState(0);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableModalKey, setTableModalKey] = useState(0);
  const [imageUploading, setImageUploading] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    open: false,
    x: 0,
    y: 0,
    pos: null,
    targetType: "codeBlock",
  });

  const initialHtmlRef = useRef(toEditorHtml(controlledContent || ""));
  const editingCodeBlockPosRef = useRef(null);
  const editorRef = useRef(null);
  const imageInputRef = useRef(null);
  const toolbarHostRef = useRef(null);
  const openEditModalRef = useRef(() => {});
  const showContextMenuRef = useRef(() => {});

  const pinnedToolbar = usePinnedEditorToolbar({
    enabled: embedded && showToolbar && Boolean(toolbarAnchorRef),
    anchorRef: toolbarAnchorRef,
    toolbarRef: toolbarHostRef,
  });

  const title = controlledTitle !== undefined ? controlledTitle : internalTitle;
  const showTitleRow = !hideTitle;

  const closeContextMenu = useCallback(() => {
    setContextMenu((current) => ({
      ...current,
      open: false,
      pos: null,
      targetType: "codeBlock",
    }));
  }, []);

  const openInsertModal = useCallback(() => {
    editingCodeBlockPosRef.current = null;
    setCodeModalInitial(DEFAULT_CODE_MODAL);
    setCodeModalKey((key) => key + 1);
    setCodeModalOpen(true);
  }, []);

  const openEditModal = useCallback((pos) => {
    const currentEditor = editorRef.current;
    const info = getCodeBlockInfo(currentEditor, pos);
    if (!info) return;

    editingCodeBlockPosRef.current = pos;
    setCodeModalInitial({
      code: info.code,
      language: info.language,
    });
    setCodeModalKey((key) => key + 1);
    setCodeModalOpen(true);
  }, []);

  const openLinkModal = useCallback(() => {
    const initial = getLinkModalInitial(editorRef.current);
    setLinkModalInitial(initial);
    setLinkModalKey((key) => key + 1);
    setLinkModalOpen(true);
  }, []);

  const openTableModal = useCallback(() => {
    setTableModalKey((key) => key + 1);
    setTableModalOpen(true);
  }, []);

  openEditModalRef.current = openEditModal;
  showContextMenuRef.current = ({ x, y, pos, targetType }) => {
    setContextMenu({ open: true, x, y, pos, targetType });
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: false,
        horizontalRule: {
          HTMLAttributes: {
            class: "article-divider",
          },
        },
      }),
      ArticleCodeBlock,
      ArticleTableCaption,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: true,
        autolink: false,
        linkOnPaste: false,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "article-editor-image",
        },
        resize: {
          enabled: true,
          directions: [
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ],
          minWidth: 80,
          minHeight: 80,
          alwaysPreserveAspectRatio: true,
        },
      }),
      ArticleTable.configure({
        resizable: true,
        handleWidth: 6,
        cellMinWidth: 60,
        lastColumnResizable: true,
        HTMLAttributes: {
          class: "article-editor-table",
        },
      }),
      ArticleTableRow,
      TableHeader,
      TableCell,
    ],
    content: initialHtmlRef.current,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap",
        "data-placeholder": `# 创作灵感 #
• 记录工作实践、项目复盘
• 写技术笔记巩固知识要点
• 发表职场感悟心得
• 搬运自己的原创文章到这里`,
      },
      handleDOMEvents: {
        dblclick(view, event) {
          const pre = event.target.closest?.("pre");
          if (!pre || !view.dom.contains(pre)) return false;

          event.preventDefault();
          event.stopPropagation();

          const pos = getCodeBlockPosFromView(view, pre);
          if (pos != null) openEditModalRef.current(pos);
          return true;
        },
        contextmenu(view, event) {
          const pre = event.target.closest?.("pre");
          if (pre && view.dom.contains(pre)) {
            event.preventDefault();
            event.stopPropagation();

            const pos = getCodeBlockPosFromView(view, pre);
            if (pos != null) {
              showContextMenuRef.current({
                x: event.clientX,
                y: event.clientY,
                pos,
                targetType: "codeBlock",
              });
            }
            return true;
          }

          const tableTarget =
            event.target.closest?.("table") ||
            event.target.closest?.("td") ||
            event.target.closest?.("th");
          if (tableTarget && view.dom.contains(tableTarget)) {
            event.preventDefault();
            event.stopPropagation();

            const pos = getTablePosFromView(view, tableTarget);
            if (pos != null) {
              showContextMenuRef.current({
                x: event.clientX,
                y: event.clientY,
                pos,
                targetType: "table",
              });
            }
            return true;
          }

          return false;
        },
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onContentChange?.(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (!editor || !onContentChange) return;
    onContentChange(editor.getHTML());
  }, [editor, onContentChange]);

  function handleTitleChange(value) {
    if (onTitleChange) onTitleChange(value);
    else setInternalTitle(value);
  }

  function handleCloseCodeModal() {
    editingCodeBlockPosRef.current = null;
    setCodeModalOpen(false);
  }

  function handleInsertCode(code, language) {
    const editPos = editingCodeBlockPosRef.current;

    if (editPos != null) {
      updateCodeBlockAtPos(editor, editPos, code, language);
    } else {
      insertCodeBlock(editor, code, language);
    }

    editingCodeBlockPosRef.current = null;
    setCodeModalOpen(false);
  }

  function handleCloseLinkModal() {
    setLinkModalOpen(false);
  }

  function handleInsertLink(url, text) {
    if (!url.trim()) {
      alert("请输入链接地址");
      return;
    }

    insertEditorLink(editor, url, text);
    setLinkModalOpen(false);
  }

  function handleCloseTableModal() {
    setTableModalOpen(false);
  }

  function handleInsertTable(options) {
    insertEditorTable(editor, options);
    setTableModalOpen(false);
  }

  function handlePickImage() {
    imageInputRef.current?.click();
  }

  async function handleImageFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editor) return;

    setImageUploading(true);
    try {
      const imageUrl = await uploadArticleImage(file);
      insertEditorImage(editor, imageUrl, file.name.replace(/\.[^.]+$/, ""));
    } catch (error) {
      alert(error.message || "图片上传失败");
    } finally {
      setImageUploading(false);
    }
  }

  async function handleContextMenuAction(action) {
    const pos = contextMenu.pos;
    const targetType = contextMenu.targetType;
    closeContextMenu();
    if (pos == null || !editor) return;

    if (targetType === "table") {
      if (action === "cut") {
        await cutTable(editor, pos);
        return;
      }
      if (action === "copy") {
        await copyTableText(editor, pos);
        return;
      }
      if (action === "delete") {
        deleteTableAtPos(editor, pos);
      }
      return;
    }

    if (action === "cut") {
      await cutCodeBlock(editor, pos);
      return;
    }
    if (action === "copy") {
      await copyCodeBlockText(editor, pos);
      return;
    }
    if (action === "paste") {
      await pasteIntoCodeBlock(editor, pos);
      return;
    }
    if (action === "delete") {
      deleteCodeBlockAtPos(editor, pos);
    }
  }

  const MIN_TITLE_LENGTH = 5;
  const MAX_TITLE_LENGTH = 100;
  const remainingChars = MIN_TITLE_LENGTH - title.length;
  const isTitleValid =
    title.length >= MIN_TITLE_LENGTH && title.length <= MAX_TITLE_LENGTH;

  return (
    <div
      className={`editor-container${embedded ? " embedded" : ""}`}
      style={
        pinnedToolbar.active
          ? { paddingTop: `${pinnedToolbar.height}px` }
          : undefined
      }
    >
      {showToolbar && (
        <div
          ref={toolbarHostRef}
          className={`editor-toolbar-host${
            pinnedToolbar.active ? " editor-toolbar-host--fixed" : ""
          }`}
          style={
            pinnedToolbar.active
              ? {
                  top: `${pinnedToolbar.top}px`,
                  left: `${pinnedToolbar.left}px`,
                  width: `${pinnedToolbar.width}px`,
                }
              : undefined
          }
        >
          <EditorToolbar
            editor={editor}
            onOpenCodeModal={openInsertModal}
            onOpenLinkModal={openLinkModal}
            onOpenTableModal={openTableModal}
            onPickImage={handlePickImage}
            imageUploading={imageUploading}
          />
        </div>
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="editor-image-input"
        onChange={handleImageFileChange}
        tabIndex={-1}
        aria-hidden="true"
        hidden
      />

      {showTitleRow && (
        <div className="editor-title-row">
          <input
            type="text"
            className="editor-title-input"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            maxLength={MAX_TITLE_LENGTH}
            placeholder="请输入文章标题（5 ~ 100 个字）"
          />
          <span
            className={`editor-title-hint ${
              isTitleValid ? "valid" : "invalid"
            }`}
          >
            {title.length > 0
              ? isTitleValid
                ? `已输入 ${title.length} 字`
                : `还需输入 ${remainingChars} 个字`
              : `${MAX_TITLE_LENGTH}`}
          </span>
        </div>
      )}

      <div className="editor-prose">
        <EditorContent editor={editor} />
      </div>

      {codeModalOpen && (
        <CodeInsertModal
          key={codeModalKey}
          open
          onClose={handleCloseCodeModal}
          onConfirm={handleInsertCode}
          initialCode={codeModalInitial.code}
          initialLanguage={codeModalInitial.language}
        />
      )}

      {linkModalOpen && (
        <LinkInsertModal
          key={linkModalKey}
          open
          onClose={handleCloseLinkModal}
          onConfirm={handleInsertLink}
          initialUrl={linkModalInitial.url}
          initialText={linkModalInitial.text}
        />
      )}

      {tableModalOpen && (
        <TableInsertModal
          key={tableModalKey}
          open
          onClose={handleCloseTableModal}
          onConfirm={handleInsertTable}
          initialOptions={DEFAULT_TABLE_OPTIONS}
        />
      )}

      <CodeBlockContextMenu
        open={contextMenu.open}
        x={contextMenu.x}
        y={contextMenu.y}
        targetType={contextMenu.targetType}
        onAction={handleContextMenuAction}
        onClose={closeContextMenu}
      />
    </div>
  );
}
