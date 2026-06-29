"use client";
// ↑ 这行很重要！表示这是一个"客户端组件"
// 因为用到了 useState（状态管理）和 onChange（用户交互），必须在浏览器端运行
// 没有这行的话，Next.js 默认在服务器端渲染，无法响应用户输入

// ============================================================
// 文件作用：文章编辑器组件（对应图二）
// 功能对应：发布/编辑文章时的「标题输入」和「正文编辑」
// 如果标题字数提示不对 / 输入框不响应 / 下一步按钮无效，修改这个文件
// ============================================================

// 从 React 引入 useState Hook（用于管理组件内部的状态/数据）
// Hook 是 React 提供的函数，让函数组件也能有"状态"
// 类似 Java 中类的成员变量，但变化时会自动刷新页面显示
import { useState } from "react";
// 引入样式
import "./ArticleEditor.css";

/**
 * ArticleEditor 组件 - 文章编辑器（图二）
 * @param {Object} props
 *   props.initialTitle   - 初始标题（编辑模式时传入已有标题）
 *   props.initialContent - 初始内容（编辑模式时传入已有内容）
 *   props.onNext         - 点击"下一步"时的回调函数（父组件传入）
 *   props.submitLabel    - 提交按钮文字，默认"下一步"
 */
export default function ArticleEditor({
  initialTitle = "",
  initialContent = "",
  onNext,
  submitLabel = "下一步",
}) {
  // ===== 状态定义（类似 Java 的成员变量） =====
  // useState 返回 [当前值, 修改值的函数]
  // title 是当前标题，setTitle 用来修改标题
  const [title, setTitle] = useState(initialTitle);
  // content 是当前正文
  const [content, setContent] = useState(initialContent);

  // 标题最少需要 5 个字（与图二要求一致）
  const MIN_TITLE_LENGTH = 5;
  // 标题最多 100 个字
  const MAX_TITLE_LENGTH = 100;

  // 计算还需要输入多少个字
  const remainingChars = MIN_TITLE_LENGTH - title.length;
  // 标题是否有效（字数在 5~100 之间）
  const isTitleValid =
    title.length >= MIN_TITLE_LENGTH && title.length <= MAX_TITLE_LENGTH;
  // 内容是否有效（不为空）
  const isContentValid = content.trim().length > 0;
  // 是否可以进入下一步
  const canProceed = isTitleValid && isContentValid;

  /**
   * 处理"下一步"按钮点击
   * 把标题和内容传给父组件
   */
  function handleNext() {
    // 如果不满足条件，不执行
    if (!canProceed) return;
    // 调用父组件传入的回调函数，传递标题和内容
    // 类似 Java 的回调接口：onNext.onComplete(title, content)
    onNext({ title, content });
  }

  return (
    <div className="editor-container">
      {/* ===== 标题输入行 ===== */}
      <div className="editor-title-row">
        {/* 标题输入框
            value={title}        → 输入框显示的值绑定到 title 状态
            onChange             → 用户输入时触发，更新 title 状态
            maxLength            → 最多输入 100 字
            placeholder          → 没输入时显示的灰色提示文字
        */}
        <input
          type="text"
          className="editor-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
        onChange={(e) => setContent(e.target.value)}
        placeholder={`#创作灵感#
• 记录工作实践、项目复盘
• 写技术笔记巩固知识要点
• 发表职场感悟心得
• 搬运自己的原创文章到这`}
      />

      {/* ===== 底部按钮 ===== */}
      <div className="editor-actions">
        {/* 下一步按钮：不满足条件时禁用（灰色不可点击） */}
        <button
          className="editor-btn editor-btn-primary"
          onClick={handleNext}
          disabled={!canProceed}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
