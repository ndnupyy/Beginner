// ============================================================
// 文件作用：文章详情页（Read - 查看单篇文章）
// 访问地址：http://localhost:3000/article/[id]
// 功能对应：显示文章完整内容、作者信息、标签、编辑/删除按钮（不含封面图）
// 如果文章详情显示不对 / 阅读量不增加，检查这个文件
// ============================================================

import { getArticleById, incrementViews } from "@/lib/articles";
import { formatViews } from "@/lib/format";
// 引入操作按钮组件（编辑、删除）
import ArticleActions from "@/components/ArticleActions";
import BackToHome from "@/components/BackToHome";
import { notFound } from "next/navigation";

/**
 * ArticleDetailPage - 文章详情页
 * @param {Object} props
 *   props.params - URL 中的动态参数，{ id: "文章ID" }
 */
export default async function ArticleDetailPage({ params }) {
  // 从 URL 中获取文章 ID（Next.js 16 中 params 是 Promise）
  const { id } = await params;

  // 先查找文章是否存在
  const article = await getArticleById(id);

  if (!article) {
    notFound();
  }

  await incrementViews(id);
  const updatedArticle = await getArticleById(id);

  // 格式化发布时间为可读格式
  const formattedDate = new Date(updatedArticle.createdAt).toLocaleDateString(
    "zh-CN",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="page-container">
      <BackToHome />

      {/* 文章详情容器 */}
      <article className="article-detail">
        {/* 文章标题 */}
        <h1 className="article-detail-title">{updatedArticle.title}</h1>

        {/* 元信息：作者、发布时间、阅读量 */}
        <div className="article-detail-meta">
          {/* 作者信息 */}
          <div className="article-detail-author">
            <img
              src={updatedArticle.authorAvatar}
              alt={updatedArticle.authorName}
              className="article-detail-avatar"
            />
            <span>{updatedArticle.authorName}</span>
          </div>
          {/* 发布时间 */}
          <span>{formattedDate}</span>
          {/* 阅读量 */}
          <span>👁 阅读 {formatViews(updatedArticle.views)}</span>
          {/* 文章类型 */}
          <span>{updatedArticle.articleType}</span>
          {/* 分类 */}
          {updatedArticle.category && (
            <span>📁 {updatedArticle.category}</span>
          )}
        </div>

        {/* 标签列表 */}
        {updatedArticle.tags && updatedArticle.tags.length > 0 && (
          <div className="article-detail-tags">
            {updatedArticle.tags.map((tag) => (
              <span key={tag} className="article-detail-tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 文章正文内容（封面图仅在首页卡片展示，详情页不显示） */}
        <div className="article-detail-content">
          {updatedArticle.content}
        </div>

        {/* 编辑和删除按钮（客户端组件） */}
        <ArticleActions articleId={id} />
      </article>
    </div>
  );
}
