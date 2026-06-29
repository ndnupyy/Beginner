"use client";
// ↑ 这行很重要！表示这是一个"客户端组件"
// 因为用到了 useState（状态管理）和 onChange（用户交互），必须在浏览器端运行
// 没有这行的话，Next.js 默认在服务器端渲染，无法响应用户输入

// ============================================================
// 文件作用：文章编辑器组件（对应图二）
// 功能对应：发布/编辑文章时的「标题输入」和「正文编辑」
// 如果标题字数提示不对 / 输入框不响应，修改这个文件
// ============================================================

import { useState } from "react";
import "./ArticleEditor.css";

/**
 * ArticleEditor 组件 - 文章编辑器（图二）
 * @param {Object} props
 *   props.title          - 标题（由父组件 ArticleForm 统一管理）
 *   props.content        - 正文（由父组件 ArticleForm 统一管理）
 *   props.onTitleChange  - 标题变化时的回调
 *   props.onContentChange- 正文变化时的回调
 *   props.embedded       - 是否为嵌入模式（单页表单内使用，不显示"下一步"按钮）
 */
export default function ArticleEditor({
  title: controlledTitle,
  content: controlledContent,
  onTitleChange,
  onContentChange,
  embedded = false,
}) {
  // 如果父组件传了 title/content，就用父组件的值（受控模式）
  // 否则用组件内部自己的 state（独立使用时的兼容）
  const [internalTitle, setInternalTitle] = useState("");
  const [internalContent, setInternalContent] = useState("");

  const title = controlledTitle !== undefined ? controlledTitle : internalTitle;
  const content =
    controlledContent !== undefined ? controlledContent : internalContent;

  // 统一的标题修改函数：同时更新父组件和内部 state
  function handleTitleChange(value) {
    if (onTitleChange) onTitleChange(value);
    else setInternalTitle(value);
  }

  // 统一的正文修改函数
  function handleContentChange(value) {
    if (onContentChange) onContentChange(value);
    else setInternalContent(value);
  }

  // 标题最少需要 5 个字
  const MIN_TITLE_LENGTH = 5;
  // 标题最多 100 个字
  const MAX_TITLE_LENGTH = 100;

  // 计算还需要输入多少个字
  const remainingChars = MIN_TITLE_LENGTH - title.length;
  // 标题是否有效（字数在 5~100 之间）
  const isTitleValid =
    title.length >= MIN_TITLE_LENGTH && title.length <= MAX_TITLE_LENGTH;

  return (
    <div className={`editor-container${embedded ? " embedded" : ""}`}>
      {/* ===== 标题输入行 ===== */}
      <div className="editor-title-row">
        <input
          type="text"
          className="editor-title-input"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          maxLength={MAX_TITLE_LENGTH}
          placeholder="请输入文章标题 (5 ~ 100个字)"
        />
        {/* 字数提示：根据是否满足条件显示不同文字和颜色 */}
        <span
          className={`editor-title-hint ${
            isTitleValid ? "valid" : "invalid"
          }`}
        >
          {isTitleValid
            ? `已输入 ${title.length} 字`
            : `还需输入 ${remainingChars} 个字`}
        </span>
      </div>

      {/* ===== 正文编辑区 ===== */}
      <textarea
        className="editor-content-textarea"
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        placeholder={`#创作灵感#
• 记录工作实践、项目复盘
• 写技术笔记巩固知识要点
• 发表职场感悟心得
• 搬运自己的原创文章到这`}
      />
    </div>
  );
}
