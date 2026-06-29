"use client";
// 客户端组件：写文章/编辑文章的统一单页表单

// ============================================================
// 文件作用：写文章和编辑文章的统一表单（单页滚动）
// 功能对应：把「编辑内容（图二）」和「发布设置（图三）」放在同一页面
// 用户通过向下滚动在两个区域之间切换，不再需要点"下一步"
// 如果表单布局或发布逻辑出问题，检查这个文件
// ============================================================

import { useState } from "react";
// 文章编辑器（标题 + 正文）
import ArticleEditor from "@/components/ArticleEditor";
// 发布设置（标签 + 封面 + 摘要等）
import ArticleSettings from "@/components/ArticleSettings";
import "./ArticleForm.css";

/**
 * ArticleForm 组件 - 统一的写文章/编辑文章表单
 * @param {Object} props
 *   props.initialData - 初始数据（编辑模式传入已有文章）
 *   props.onSubmit    - 提交回调（发布或保存），由父页面传入 API 调用逻辑
 *   props.isEditing   - 是否为编辑模式（影响按钮文字）
 */
export default function ArticleForm({
  initialData = {},
  onSubmit,
  isEditing = false,
}) {
  // ===== 编辑内容区的状态（图二） =====
  // 文章标题
  const [title, setTitle] = useState(initialData.title || "");
  // 文章正文
  const [content, setContent] = useState(initialData.content || "");

  /**
   * 发布/保存按钮点击时的处理
   * @param {Object} settingsData - 来自 ArticleSettings 的设置项数据
   */
  async function handlePublish(settingsData) {
    // 校验标题和内容（与原来"下一步"的校验逻辑一致）
    if (!title || title.length < 5) {
      alert("标题至少需要 5 个字");
      // 滚动到页面顶部，让用户看到标题输入框
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!content || content.trim().length === 0) {
      alert("文章内容不能为空");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // 合并编辑内容和发布设置，组成完整文章对象
    const fullArticle = {
      title,
      content,
      ...settingsData,
    };

    // 调用父页面传入的提交函数（发布页走 POST，编辑页走 PUT）
    await onSubmit(fullArticle);
  }

  return (
    <div className="article-form-page">
      {/* ===== 第一区块：编辑内容（图二） ===== */}
      <section className="article-form-section">
        <h2 className="article-form-section-title">编辑内容</h2>
        <ArticleEditor
          title={title}
          content={content}
          onTitleChange={setTitle}
          onContentChange={setContent}
          embedded={true}
        />
      </section>

      {/* ===== 第二区块：发布设置（图三） ===== */}
      <section className="article-form-section">
        <h2 className="article-form-section-title">
          {isEditing ? "编辑设置" : "发布设置"}
        </h2>
        <ArticleSettings
          content={content}
          initialSettings={{
            summary: initialData.summary,
            tags: initialData.tags,
            thumbnailUrl: initialData.thumbnailUrl,
            category: initialData.category,
            articleType: initialData.articleType,
            visibility: initialData.visibility,
          }}
          onPublish={handlePublish}
          isEditing={isEditing}
          embedded={true}
        />
      </section>
    </div>
  );
}
