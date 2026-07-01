"use client";
// ============================================================
// 文件作用：写文章 / 编辑文章统一表单（CSDN 宽版布局）
// 功能对应：编辑器 + 发文设置 + 底部保存草稿 / 发布
// ============================================================

import { useMemo, useRef, useState } from "react";
import { getContentPlainText, getContentTextLength } from "@/lib/contentFormat";
import ArticleEditor from "@/components/ArticleEditor";
import ArticleSettings from "@/components/ArticleSettings";
import "./ArticleForm.css";

export default function ArticleForm({
  initialData = {},
  onSubmit,
  onSaveDraft,
  isEditing = false,
  isDraft = false,
}) {
  const settingsRef = useRef(null);
  const editorCardRef = useRef(null);
  const [title, setTitle] = useState(initialData.title || "");
  const [content, setContent] = useState(initialData.content || "");
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const wordCount = useMemo(
    () => (title?.length || 0) + getContentTextLength(content),
    [title, content]
  );

  function getFullArticle(settingsData, status) {
    return {
      title,
      content,
      ...settingsData,
      status,
    };
  }

  function validatePublish() {
    if (!title || title.length < 5) {
      alert("标题至少需要 5 个字");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }
    if (!getContentPlainText(content)) {
      alert("文章内容不能为空");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }
    return true;
  }

  async function handlePublish() {
    if (publishing || savingDraft) return;
    if (!validatePublish()) return;

    setPublishing(true);
    try {
      const settingsData = settingsRef.current?.getSettings() || {};
      await onSubmit(getFullArticle(settingsData, "published"));
    } finally {
      setPublishing(false);
    }
  }

  async function handleSaveDraft() {
    if (publishing || savingDraft) return;

    setSavingDraft(true);
    try {
      const settingsData = settingsRef.current?.getSettings() || {};
      await onSaveDraft(getFullArticle(settingsData, "draft"));
    } finally {
      setSavingDraft(false);
    }
  }

  return (
    <div className="article-form-page">
      <div className="write-editor-card" ref={editorCardRef}>
        <div className="write-title-row">
          <input
            type="text"
            className="write-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="请输入文章标题（5 ~ 100 个字）"
          />
        </div>
        <ArticleEditor
          content={content}
          onContentChange={setContent}
          embedded
          showToolbar
          hideTitle
          toolbarAnchorRef={editorCardRef}
        />
      </div>

      <div className="write-settings-panel" id="write-settings-panel">
        <ArticleSettings
          ref={settingsRef}
          content={content}
          initialSettings={{
            summary: initialData.summary,
            tags: initialData.tags,
            thumbnailUrl: initialData.thumbnailUrl,
            category: initialData.category,
            articleType: initialData.articleType,
            visibility: initialData.visibility,
          }}
          isEditing={isEditing}
          embedded
          hideActions
        />
      </div>

      <div className="write-action-bar">
        <div className="write-action-bar-inner">
          <div className="write-action-left">
            <span className="write-word-count">共 {wordCount} 字</span>
            {isDraft && (
              <span className="write-draft-badge">草稿</span>
            )}
          </div>

          <div className="write-action-right">
            <button
              type="button"
              className="write-btn write-btn-secondary"
              onClick={handleSaveDraft}
              disabled={savingDraft || publishing}
            >
              {savingDraft ? "保存中..." : "保存草稿"}
            </button>
            <button
              type="button"
              className="write-btn write-btn-primary"
              onClick={handlePublish}
              disabled={publishing || savingDraft}
            >
              {publishing
                ? isEditing
                  ? "发布中..."
                  : "发布中..."
                : isEditing && initialData.status === "published"
                ? "保存并发布"
                : "发布博客"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
