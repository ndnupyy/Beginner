// ============================================================
// 文件作用：文章详情页（Read - 查看单篇文章）
// 访问地址：http://localhost:3000/article/[id]
// 功能对应：显示文章完整内容、作者信息、标签、编辑/删除按钮
// 如果文章详情显示不对 / 阅读量不增加，检查这个文件
// ============================================================

import { getArticleById, incrementViews, formatViews } from "@/lib/articles";
// 引入操作按钮组件（编辑、删除）
import ArticleActions from "@/components/ArticleActions";
// notFound 是 Next.js 提供的函数，调用后会显示 404 页面
import { notFound } from "next/navigation";
import Link from "next/link";

/**
 * ArticleDetailPage - 文章详情页
 * @param {Object} props
 *   props.params - URL 中的动态参数，{ id: "文章ID" }
 */
export default async function ArticleDetailPage({ params }) {
  // 从 URL 中获取文章 ID（Next.js 16 中 params 是 Promise）
  const { id } = await params;

  // 先查找文章是否存在
  const article = getArticleById(id);

  // 如果找不到文章，显示 404 页面
  if (!article) {
    notFound();
  }

  // 增加阅读量（每次访问详情页 +1）
  incrementViews(id);
  // 重新获取更新后的文章（阅读量已 +1）
  const updatedArticle = getArticleById(id);

  // 格式化发布时间为可读格式
  const formattedDate = new Date(updatedArticle.createdAt).toLocaleDateString(
    "zh-CN",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="page-container">
      {/* 返回首页链接 */}
      <div style={{ marginBottom: "16px" }}>
        <Link href="/" style={{ color: "#999", textDecoration: "none", fontSize: "14px" }}>
          ← 返回首页
        </Link>
      </div>

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

        {/* 封面图（如果有） */}
        {updatedArticle.thumbnailUrl && (
          <div style={{ marginBottom: "24px" }}>
            <img
              src={updatedArticle.thumbnailUrl}
              alt={updatedArticle.title}
              style={{
                width: "100%",
                maxHeight: "400px",
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
          </div>
        )}

        {/* 文章正文内容 */}
        <div className="article-detail-content">
          {updatedArticle.content}
        </div>

        {/* 编辑和删除按钮（客户端组件） */}
        <ArticleActions articleId={id} />
      </article>
    </div>
  );
}
