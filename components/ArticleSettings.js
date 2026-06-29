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
 *   props.articleData  - 第一步编辑器传来的标题和内容
 *   props.initialSettings - 初始设置（编辑模式时传入已有设置）
 *   props.onBack       - 点击"返回"时的回调
 *   props.onPublish    - 点击"发布"时的回调，传递完整文章数据
 *   props.isEditing    - 是否为编辑模式
 */
export default function ArticleSettings({
  articleData,
  initialSettings = {},
  onBack,
  onPublish,
  isEditing = false,
}) {
  // ===== 各项设置的状态 =====
  // 文章标签（字符串数组，如 ["Next.js", "React"]）
  const [tags, setTags] = useState(initialSettings.tags || []);
  // 是否正在输入新标签
  const [isAddingTag, setIsAddingTag] = useState(false);
  // 新标签的输入值
  const [newTag, setNewTag] = useState("");
  // 封面图片 URL（本地上传后转为 base64 字符串存储）
  const [thumbnailUrl, setThumbnailUrl] = useState(
    initialSettings.thumbnailUrl || ""
  );
  // 文章摘要
  const [summary, setSummary] = useState(initialSettings.summary || "");
  // 分类专栏
  const [category, setCategory] = useState(initialSettings.category || "");
  // 文章类型：原创 / 转载 / 翻译
  const [articleType, setArticleType] = useState(
    initialSettings.articleType || "原创"
  );
  // 可见范围
  const [visibility, setVisibility] = useState(
    initialSettings.visibility || "全部可见"
  );
  // 是否正在发布中（防止重复点击）
  const [isPublishing, setIsPublishing] = useState(false);

  // 摘要最大字数
  const MAX_SUMMARY_LENGTH = 256;

  /**
   * 添加标签
   */
  function handleAddTag() {
    // 去掉首尾空格
    const trimmed = newTag.trim();
    // 非空且未重复时才添加
    if (trimmed && !tags.includes(trimmed)) {
      // ...tags 是展开运算符，把旧数组元素展开，再加上新元素
      setTags([...tags, trimmed]);
    }
    // 清空输入框并关闭输入状态
    setNewTag("");
    setIsAddingTag(false);
  }

  /**
   * 删除标签
   * @param {string} tagToRemove - 要删除的标签名
   */
  function handleRemoveTag(tagToRemove) {
    // filter 过滤掉要删除的标签，保留其余
    setTags(tags.filter((tag) => tag !== tagToRemove));
  }

  /**
   * 处理封面图片上传
   * @param {Event} e - 文件选择事件
   */
  function handleCoverUpload(e) {
    // 获取用户选择的文件
    const file = e.target.files[0];
    if (!file) return;
    // FileReader 是浏览器 API，用于读取本地文件
    const reader = new FileReader();
    // 文件读取完成后，将结果（base64 字符串）设为封面 URL
    reader.onload = (event) => {
      setThumbnailUrl(event.target.result);
    };
    // 以 Data URL（base64）格式读取文件
    reader.readAsDataURL(file);
  }

  /**
   * 从正文自动提取摘要（取前 100 字）
   */
  function handleAutoSummary() {
    const content = articleData.content || "";
    // 去掉换行符，取前 100 个字符作为摘要
    const autoSummary = content.replace(/\n/g, " ").slice(0, 100);
    setSummary(autoSummary);
  }

  /**
   * 处理发布按钮点击
   */
  async function handlePublish() {
    // 防止重复提交
    if (isPublishing) return;
    setIsPublishing(true);

    // 组装完整的文章数据对象
    const fullArticle = {
      // 来自第一步编辑器的标题和内容
      title: articleData.title,
      content: articleData.content,
      // 来自本表单的设置项
      summary,
      tags,
      thumbnailUrl,
      category,
      articleType,
      visibility,
    };

    try {
      // 调用父组件传入的发布回调
      await onPublish(fullArticle);
    } finally {
      // 无论成功失败，都重置发布状态
      setIsPublishing(false);
    }
  }

  return (
    <div className="settings-container">
      {/* 表单标题 */}
      <h2 className="settings-title">
        {isEditing ? "编辑文章设置" : "发布文章设置"}
      </h2>

      {/* ===== 文章标签 ===== */}
      <div className="settings-row">
        <label className="settings-label">文章标签</label>
        <div className="settings-field">
          {/* 如果正在添加标签，显示输入框；否则显示添加按钮 */}
          {isAddingTag ? (
            <input
              className="settings-tag-input"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                // 按 Enter 键确认添加
                if (e.key === "Enter") handleAddTag();
                // 按 Escape 键取消
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
          {/* 已添加的标签列表 */}
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
            {/* 如果已有封面，显示预览；否则显示上传按钮 */}
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt="封面预览"
                className="settings-cover-preview"
              />
            ) : null}
            {/* 上传区域：点击触发隐藏的文件选择框 */}
            <label className="settings-cover-upload">
              <span className="settings-cover-upload-icon">+</span>
              从本地上传
              {/* 隐藏的 file input，accept 限制只能选图片 */}
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
          {/* 字数统计 */}
          <div className="settings-char-count">
            {summary.length} / {MAX_SUMMARY_LENGTH}
          </div>
          {/* 自动提取摘要按钮 */}
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
            {/* 遍历三种类型，生成单选按钮 */}
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
            {["全部可见", "仅我可见", "粉丝可见", "VIP可见"].map((v) => (
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

      {/* ===== 底部按钮 ===== */}
      <div className="settings-actions">
        {/* 返回上一步 */}
        <button className="settings-btn-back" onClick={onBack}>
          ← 返回编辑
        </button>
        {/* 发布 / 保存按钮 */}
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
