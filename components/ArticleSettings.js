"use client";
// 客户端组件：包含表单交互和状态管理

// ============================================================
// 文件作用：文章发布设置表单（对应图三）
// 功能对应：标签、封面、摘要、分类、文章类型、可见范围等设置
// 如果发布设置项出问题 / 发布按钮无效，修改这个文件
// ============================================================

import { useState } from "react";
import "./ArticleSettings.css";

/**
 * ArticleSettings 组件 - 文章发布设置（图三）
 * @param {Object} props
 *   props.content          - 文章正文（用于自动提取摘要）
 *   props.initialSettings  - 初始设置（编辑模式时传入已有设置）
 *   props.onPublish        - 点击"发布"时的回调，传递设置项数据
 *   props.isEditing        - 是否为编辑模式
 *   props.embedded         - 是否为嵌入模式（单页表单，不显示"返回"按钮）
 */
export default function ArticleSettings({
  content = "",
  initialSettings = {},
  onPublish,
  isEditing = false,
  embedded = false,
}) {
  // ===== 各项设置的状态 =====
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

  async function handlePublish() {
    if (isPublishing) return;
    setIsPublishing(true);

    // 只传递设置项数据，标题和正文由 ArticleForm 合并
    const settingsData = {
      summary,
      tags,
      thumbnailUrl,
      category,
      articleType,
      visibility,
    };

    try {
      await onPublish(settingsData);
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className={`settings-container${embedded ? " embedded" : ""}`}>
      {/* 独立使用时才显示内部标题（嵌入模式由 ArticleForm 显示区块标题） */}
      {!embedded && (
        <h2 className="settings-title">
          {isEditing ? "编辑文章设置" : "发布文章设置"}
        </h2>
      )}

      {/* ===== 文章标签 ===== */}
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

      {/* ===== 添加封面 ===== */}
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

      {/* ===== 文章摘要 ===== */}
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
            className="settings-add-btn"
            onClick={handleAutoSummary}
            style={{ marginTop: "8px" }}
          >
            ✨ 自动提取摘要
          </button>
        </div>
      </div>

      {/* ===== 分类专栏 ===== */}
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

      {/* ===== 文章类型（单选） ===== */}
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

      {/* ===== 可见范围（单选） ===== */}
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

      {/* ===== 底部发布按钮 ===== */}
      <div className={`settings-actions${embedded ? " single-page" : ""}`}>
        <button
          className="settings-btn-publish"
          onClick={handlePublish}
          disabled={isPublishing}
        >
          {isPublishing
            ? "发布中..."
            : isEditing
            ? "保存修改"
            : "发布文章"}
        </button>
      </div>
    </div>
  );
}
