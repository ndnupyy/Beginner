// ============================================================
// 文件作用：用户个人主页数据聚合
// 功能对应：/user/[id] 个人主页、GET /api/users/[id]/profile
// 维护指引：
//   - 统计字段 → 本文件 getUserProfile
//   - 关注关系 → lib/follows.js
// ============================================================

import { readyDb } from "@/lib/prisma";
import { getUserById } from "@/lib/users";
import { enrichArticleFromRow, ARTICLE_STATUS } from "@/lib/articles";
import {
  getFollowerCount,
  getFollowingCount,
  isFollowing,
} from "@/lib/follows";

function calcCodeAgeYears(createdAt) {
  if (!createdAt) return 1;
  const years = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  return Math.max(1, years);
}

function calcBlogLevel(articleCount) {
  if (articleCount >= 100) return 10;
  if (articleCount >= 50) return 8;
  if (articleCount >= 20) return 6;
  if (articleCount >= 10) return 5;
  if (articleCount >= 5) return 4;
  if (articleCount >= 3) return 3;
  if (articleCount >= 1) return 2;
  return 1;
}

function pickPrimaryCategory(articles) {
  const counts = new Map();
  for (const row of articles) {
    const name = row.category?.trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  if (counts.size === 0) return "博客作者";
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * 获取用户个人主页完整数据
 * @param {string} userId - 主页所属用户
 * @param {string|null} viewerId - 当前访问者
 */
export async function getUserProfile(userId, viewerId = null) {
  const user = await getUserById(userId);
  if (!user) return null;

  const prisma = await readyDb();
  const isSelf = Boolean(viewerId && viewerId === userId);

  const publishedRows = await prisma.articles.findMany({
    where: { author_id: userId, status: ARTICLE_STATUS.published },
    orderBy: { created_at: "desc" },
  });

  let draftRows = [];
  if (isSelf) {
    draftRows = await prisma.articles.findMany({
      where: { author_id: userId, status: ARTICLE_STATUS.draft },
      orderBy: { updated_at: "desc" },
    });
  }

  const publishedArticles = await Promise.all(
    publishedRows.map(enrichArticleFromRow)
  );
  const draftArticles = await Promise.all(draftRows.map(enrichArticleFromRow));

  const originalCount = publishedRows.filter(
    (row) => row.article_type === "原创"
  ).length;
  const totalLikes = publishedRows.reduce((sum, row) => sum + (row.likes || 0), 0);
  const totalFavorites = publishedRows.reduce(
    (sum, row) => sum + (row.favorites || 0),
    0
  );
  const totalViews = publishedRows.reduce((sum, row) => sum + (row.views || 0), 0);

  const fansCount = await getFollowerCount(userId);
  const followingCount = await getFollowingCount(userId);
  const canFollow = Boolean(!isSelf && viewerId);
  const following = canFollow ? await isFollowing(viewerId, userId) : false;

  const categories = [...new Set(
    publishedRows
      .map((row) => row.category?.trim())
      .filter(Boolean)
  )].map((name) => ({
    name,
    count: publishedRows.filter((row) => row.category?.trim() === name).length,
  }));

  return {
    userId: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    blogLevel: calcBlogLevel(publishedRows.length),
    codeAgeYears: calcCodeAgeYears(user.createdAt),
    creatorField: pickPrimaryCategory(publishedRows),
    isQualityCreator: publishedRows.length >= 3,
    isSelf,
    canFollow,
    requireLogin: Boolean(!isSelf && !viewerId),
    isFollowing: following,
    stats: {
      originalCount,
      totalLikes,
      totalFavorites,
      totalViews,
      fansCount,
      followingCount,
      articleCount: publishedRows.length,
    },
    categories,
    publishedArticles,
    draftArticles,
  };
}
