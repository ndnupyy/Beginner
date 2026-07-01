// ============================================================
// 文件作用：首页资讯头条轮播数据筛选
// 功能对应：导航栏下方轮播图（最多 5 条，优先有封面 + 高阅读量）
// 维护指引：轮播内容不对 → 本文件；UI → components/HomeHeadlineCarousel.js
// ============================================================

// 轮播最多展示条数
export const HEADLINE_CAROUSEL_LIMIT = 5;

/**
 * 计算单篇文章作为头条的权重（有封面优先，其次按阅读量）
 * @param {{ thumbnailUrl?: string, views?: number, updatedAt?: string }} article
 * @returns {number}
 */
function getHeadlineScore(article) {
  const views = Number(article.views) || 0;
  const hasThumb = article.thumbnailUrl ? 100000 : 0;
  const updated = article.updatedAt
    ? new Date(article.updatedAt).getTime()
    : 0;
  return hasThumb + views * 10 + updated / 1e10;
}

/**
 * 选取首页资讯头条轮播文章
 * @param {object[]} articles
 * @param {number} [limit=HEADLINE_CAROUSEL_LIMIT]
 * @returns {object[]}
 */
export function getHeadlineCarouselArticles(articles, limit = HEADLINE_CAROUSEL_LIMIT) {
  if (!Array.isArray(articles) || articles.length === 0) {
    return [];
  }

  return [...articles]
    .sort((a, b) => getHeadlineScore(b) - getHeadlineScore(a))
    .slice(0, limit)
    .map((article) => ({
      id: article.id,
      title: article.title,
      thumbnailUrl: article.thumbnailUrl || "",
      category: article.category || "",
    }));
}
