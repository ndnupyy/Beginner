// ============================================================
// 文件作用：文章详情页（Read - 查看单篇文章）
// 访问地址：http://localhost:3000/article/[id]
// 功能对应：文章正文、作者栏（左侧）、底部点赞收藏栏
// 维护指引：
//   - 作者侧栏 → components/AuthorSidebar.js
//   - 点赞收藏 → components/ArticleReactions.js
// ============================================================

import { toArticleBodyHtml } from "@/lib/contentFormat";
import { getArticleById, ARTICLE_STATUS } from "@/lib/articles";
import { formatViews, formatCount } from "@/lib/format";
import { getSessionUserId } from "@/lib/session";
import ArticleActions from "@/components/ArticleActions";
import ArticleReactions from "@/components/ArticleReactions";
import ArticleViewTracker from "@/components/ArticleViewTracker";
import { notFound } from "next/navigation";

export default async function ArticleDetailPage({ params }) {
  const { id } = await params;

  const article = await getArticleById(id);
  if (!article) {
    notFound();
  }

  if (article.status === ARTICLE_STATUS.draft) {
    const userId = await getSessionUserId();
    if (!userId || userId !== article.authorId) {
      notFound();
    }
  }

  const formattedDate = new Date(article.createdAt).toLocaleString(
    "zh-CN",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <>
      <ArticleViewTracker articleId={id} />
      <div className="page-container page-container--article">
        <article className="article-detail">
          <h1 className="article-detail-title">{article.title}</h1>

          <div className="article-detail-meta">
            <span className="article-detail-type-tag">
              {article.articleType}
            </span>
            <span>{formattedDate}</span>
            <span>👁 {formatViews(article.views)} 阅读</span>
            <span>👍 {formatCount(article.likes)} 点赞</span>
            <span>⭐ {formatCount(article.favorites)} 收藏</span>
            {article.category && (
              <span>📁 {article.category}</span>
            )}
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="article-detail-tags">
              <span className="article-detail-tags-label">标签</span>
              {article.tags.map((tag) => (
                <span key={tag} className="article-detail-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div
            className="article-detail-content"
            dangerouslySetInnerHTML={{
              __html: toArticleBodyHtml(article.content),
            }}
          />

          <ArticleActions articleId={id} />
        </article>
      </div>

      <ArticleReactions
        articleId={id}
        initialLikes={article.likes}
        initialFavorites={article.favorites}
      />
    </>
  );
}
