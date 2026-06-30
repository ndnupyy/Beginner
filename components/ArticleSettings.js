"use client";
// ============================================================
// 文件作用：文章发布设置表单（标签、封面、摘要等）
// 功能对应：写文章 / 编辑页「发文设置」折叠面板
// 维护指引：通过 ref.getSettings() 读取表单值
// ============================================================

import { forwardRef, useImperativeHandle, useState } from "react";
import "./ArticleSettings.css";

const ArticleSettings = forwardRef(function ArticleSettings(
  {
    content = "",
    initialSettings = {},
    onPublish,
    isEditing = false,
    embedded = false,
    hideActions = false,
  },
  ref
) {
  const [tags, setTags] = useState(initialSettings.tags || []);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState(
    initialSettings.thumbnailUrl || ""
  );
  const [summary, setSummary] = useState(initialSettings.summary || "");
  const [category, setCategory] = useState(initialSettings.category || "");
  const [articleType, setArticleType] = useState(
    initialSettings.articleType || "原创"
  );
  const [visibility, setVisibility] = useState(
    ["全部可见", "仅我可见"].includes(initialSettings.visibility)
      ? initialSettings.visibility
      : "全部可见"
  );
  const [isPublishing, setIsPublishing] = useState(false);

  const MAX_SUMMARY_LENGTH = 256;

  useImperativeHandle(ref, () => ({
    getSettings() {
      return {
        summary,
        tags,
        thumbnailUrl,
        category,
        articleType,
        visibility,
      };
    },
  }));

  function handleAddTag() {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTag("");
    setIsAddingTag(false);
  }

  function handleRemoveTag(tagToRemove) {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  }

  function handleCoverUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setThumbnailUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  }

  function handleAutoSummary() {
    const autoSummary = content.replace(/\n/g, " ").slice(0, 100);
    setSummary(autoSummary);
  }

  async function handlePublishClick() {
    if (isPublishing || !onPublish) return;
    setIsPublishing(true);
    try {
      await onPublish({
        summary,
        tags,
        thumbnailUrl,
        category,
        articleType,
        visibility,
      });
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className={`settings-container${embedded ? " embedded" : ""}`}>
      {!embedded && (
        <h2 className="settings-title">
          {isEditing ? "编辑文章设置" : "发布文章设置"}
        </h2>
      )}

      <div className="settings-row">
        <label className="settings-label">文章标签</label>
        <div className="settings-field">
          {isAddingTag ? (
            <input
              className="settings-tag-input"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTag();
                if (e.key === "Escape") setIsAddingTag(false);
              }}
              onBlur={handleAddTag}
              placeholder="输入标签"
              autoFocus
            />
          ) : (
            <button
              type="button"
              className="settings-add-btn"
              onClick={() => setIsAddingTag(true)}
            >
              + 添加文章标签
            </button>
          )}
          {tags.length > 0 && (
            <div className="settings-tags">
              {tags.map((tag) => (
                <span key={tag} className="settings-tag">
                  {tag}
                  <button
                    type="button"
                    className="settings-tag-remove"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="settings-row">
        <label className="settings-label">添加封面</label>
        <div className="settings-field">
          <div className="settings-cover-row">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt="封面预览"
                className="settings-cover-preview"
              />
            ) : null}
            <label className="settings-cover-upload">
              <span className="settings-cover-upload-icon">+</span>
              从本地上传
              <input
                type="file"
                accept="image/*"
                className="settings-cover-input-hidden"
                onChange={handleCoverUpload}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="settings-row">
        <label className="settings-label">文章摘要</label>
        <div className="settings-field">
          <textarea
            className="settings-textarea"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={MAX_SUMMARY_LENGTH}
            placeholder="摘要会在首页、搜索页等场景外露，帮助读者快速了解内容"
          />
          <div className="settings-char-count">
            {summary.length} / {MAX_SUMMARY_LENGTH}
          </div>
          <button
            type="button"
            className="settings-add-btn"
            onClick={handleAutoSummary}
            style={{ marginTop: "8px" }}
          >
            ✨ 自动提取摘要
          </button>
        </div>
      </div>

      <div className="settings-row">
        <label className="settings-label">分类专栏</label>
        <div className="settings-field">
          <input
            className="settings-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="输入分类名称，如：前端开发"
          />
        </div>
      </div>

      <div className="settings-row">
        <label className="settings-label">文章类型</label>
        <div className="settings-field">
          <div className="settings-radio-group">
            {["原创", "转载", "翻译"].map((type) => (
              <label key={type} className="settings-radio-item">
                <input
                  type="radio"
                  name="articleType"
                  value={type}
                  checked={articleType === type}
                  onChange={(e) => setArticleType(e.target.value)}
                />
                {type}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-row">
        <label className="settings-label">可见范围</label>
        <div className="settings-field">
          <div className="settings-radio-group">
            {["全部可见", "仅我可见"].map((v) => (
              <label key={v} className="settings-radio-item">
                <input
                  type="radio"
                  name="visibility"
                  value={v}
                  checked={visibility === v}
                  onChange={(e) => setVisibility(e.target.value)}
                />
                {v}
              </label>
            ))}
          </div>
        </div>
      </div>

      {!hideActions && (
        <div className={`settings-actions${embedded ? " single-page" : ""}`}>
          <button
            type="button"
            className="settings-btn-publish"
            onClick={handlePublishClick}
            disabled={isPublishing}
          >
            {isPublishing
              ? "发布中..."
              : isEditing
              ? "保存修改"
              : "发布文章"}
          </button>
        </div>
      )}
    </div>
  );
});

export default ArticleSettings;
