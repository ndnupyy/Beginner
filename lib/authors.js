// ============================================================
// 文件作用：作者个人资料聚合（文章详情页左侧栏）
// 功能对应：原创数、获赞、被收藏、码龄、博客等级等
// 维护指引：统计逻辑 → 本文件；API → app/api/articles/[id]/author/route.js
// ============================================================

import { readyDb } from "@/lib/prisma";
import { getUserById, getUserByUsername } from "@/lib/users";
import { getArticleById } from "@/lib/articles";
import { getFollowerCount, isFollowing } from "@/lib/follows";

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

/** 解析文章对应的注册用户 ID（只读，不写库） */
async function resolveAuthorUserId(article) {
  if (article.authorId) return article.authorId;

  const authorName = article.authorName?.trim();
  if (!authorName) return null;

  const userRow = await getUserByUsername(authorName);
  return userRow?.id ?? null;
}

export async function getAuthorProfileForArticle(articleId, viewerId = null) {
  const article = await getArticleById(articleId);
  if (!article) return null;

  const prisma = await readyDb();
  const authorId = await resolveAuthorUserId(article);

  const authorArticles = authorId
    ? await prisma.articles.findMany({
        where: { author_id: authorId, status: "published" },
      })
    : await prisma.articles.findMany({
        where: { author_name: article.authorName, status: "published" },
      });

  const originalCount = authorArticles.filter(
    (row) => row.article_type === "原创"
  ).length;
  const totalLikes = authorArticles.reduce(
    (sum, row) => sum + (row.likes || 0),
    0
  );
  const totalFavorites = authorArticles.reduce(
    (sum, row) => sum + (row.favorites || 0),
    0
  );

  let user = null;
  if (authorId) {
    user = await getUserById(authorId);
  }

  const username = user?.username || article.authorName;
  const avatarUrl = user?.avatarUrl || article.authorAvatar;
  const createdAt = user?.createdAt || article.createdAt;
  const articleCount = authorArticles.length;
  const primaryCategory = pickPrimaryCategory(authorArticles);
  const fansCount = authorId ? await getFollowerCount(authorId) : 0;
  const isSelf = Boolean(viewerId && authorId && viewerId === authorId);
  const showFollowButton = Boolean(authorId && !isSelf);
  const canFollow = Boolean(showFollowButton && viewerId);
  const following =
    canFollow && authorId
      ? await isFollowing(viewerId, authorId)
      : false;

  return {
    userId: authorId || null,
    username,
    avatarUrl,
    profileBackgroundUrl: user?.profileBackgroundUrl || "",
    blogLevel: calcBlogLevel(articleCount),
    codeAgeYears: calcCodeAgeYears(createdAt),
    isQualityCreator: articleCount >= 3,
    creatorField: primaryCategory,
    isSelf,
    showFollowButton,
    canFollow,
    requireLogin: Boolean(showFollowButton && !viewerId),
    isFollowing: following,
    stats: {
      originalCount,
      totalLikes,
      totalFavorites,
      fansCount,
    },
  };
}
