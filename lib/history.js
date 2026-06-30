// ============================================================
// 文件作用：用户浏览历史（记录 / 查询）
// 功能对应：/history 页、文章详情浏览时写入
// 维护指引：
//   - 表结构 → prisma/schema.prisma browse_history
//   - API → app/api/history/route.js、app/api/articles/[id]/view/route.js
// ============================================================

import { readyDb } from "@/lib/prisma";
import { enrichArticleFromRow } from "@/lib/articles";

/** 记录或更新用户浏览某篇文章（重复浏览更新 viewed_at 并排到最前） */
export async function recordBrowseHistory(userId, articleId) {
  if (!userId || !articleId) return;

  const prisma = await readyDb();
  const article = await prisma.articles.findUnique({ where: { id: articleId } });
  if (!article || article.status !== "published") return;

  const now = new Date().toISOString();

  await prisma.browse_history.upsert({
    where: {
      user_id_article_id: {
        user_id: userId,
        article_id: articleId,
      },
    },
    create: {
      user_id: userId,
      article_id: articleId,
      viewed_at: now,
    },
    update: {
      viewed_at: now,
    },
  });
}

/** 获取用户浏览历史（按最近浏览时间倒序，仅已发布文章） */
export async function getBrowseHistory(userId) {
  if (!userId) return [];

  const prisma = await readyDb();
  const rows = await prisma.browse_history.findMany({
    where: { user_id: userId },
    orderBy: { viewed_at: "desc" },
    include: { article: true },
  });

  const articles = [];
  for (const row of rows) {
    if (!row.article || row.article.status !== "published") continue;
    const article = await enrichArticleFromRow(row.article);
    articles.push({
      ...article,
      viewedAt: row.viewed_at,
    });
  }

  return articles;
}
