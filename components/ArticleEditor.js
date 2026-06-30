"use client";
// ============================================================
// 文件作用：文章编辑器（标题 + 工具栏 + 正文）
// 功能对应：写文章 / 编辑文章主编辑区
// ============================================================

import { useState } from "react";
import "./ArticleEditor.css";

const TOOLBAR_ITEMS = [
  { label: "撤销", icon: "↶" },
  { label: "重做", icon: "↷" },
  { label: "加粗", icon: "B" },
  { label: "标题", icon: "H" },
  { label: "列表", icon: "≡" },
  { label: "引用", icon: "❝" },
  { label: "代码", icon: "</>" },
  { label: "图片", icon: "🖼" },
  { label: "链接", icon: "🔗" },
  { label: "表格", icon: "▦" },
];

export default function ArticleEditor({
  title: controlledTitle,
  content: controlledContent,
  onTitleChange,
  onContentChange,
  embedded = false,
  showToolbar = false,
}) {
  const [internalTitle, setInternalTitle] = useState("");
  const [internalContent, setInternalContent] = useState("");

  const title = controlledTitle !== undefined ? controlledTitle : internalTitle;
  const content =
    controlledContent !== undefined ? controlledContent : internalContent;

  function handleTitleChange(value) {
    if (onTitleChange) onTitleChange(value);
    else setInternalTitle(value);
  }

  function handleContentChange(value) {
    if (onContentChange) onContentChange(value);
    else setInternalContent(value);
  }

  const MIN_TITLE_LENGTH = 5;
  const MAX_TITLE_LENGTH = 100;
  const remainingChars = MIN_TITLE_LENGTH - title.length;
  const isTitleValid =
    title.length >= MIN_TITLE_LENGTH && title.length <= MAX_TITLE_LENGTH;

  return (
    <div className={`editor-container${embedded ? " embedded" : ""}`}>
      {showToolbar && (
        <div className="editor-toolbar">
          {TOOLBAR_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              className="editor-toolbar-btn"
              title={`${item.label}（即将支持）`}
              onClick={() => {}}
            >
              {item.icon}
            </button>
          ))}
        </div>
      )}

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

      <textarea
        className="editor-content-textarea"
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder={`# 创作灵感 #
• 记录工作实践、项目复盘
• 写技术笔记巩固知识要点
• 发表职场感悟心得
• 搬运自己的原创文章到这里`}
      />
    </div>
  );
}
