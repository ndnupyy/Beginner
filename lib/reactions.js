// ============================================================
// 文件作用：文章点赞 / 收藏（用户级 toggle + 计数）
// 功能对应：详情页点赞收藏、首页展示数量
// 维护指引：
//   - 表结构 → prisma/schema.prisma article_reactions
//   - API → app/api/articles/[id]/reactions/route.js
// ============================================================

import { readyDb } from "@/lib/prisma";
import { getArticleById } from "@/lib/articles";

const REACTION_TYPES = {
  like: "like",
  favorite: "favorite",
};

const COUNT_FIELDS = {
  like: "likes",
  favorite: "favorites",
};

async function getUserReactionFlags(userId, articleId) {
  if (!userId) {
    return { liked: false, favorited: false };
  }

  const prisma = await readyDb();
  const rows = await prisma.article_reactions.findMany({
    where: { user_id: userId, article_id: articleId },
    select: { type: true },
  });

  return {
    liked: rows.some((row) => row.type === REACTION_TYPES.like),
    favorited: rows.some((row) => row.type === REACTION_TYPES.favorite),
  };
}

export async function getArticleReactionState(articleId, userId) {
  const article = await getArticleById(articleId);
  if (!article) return null;

  const flags = await getUserReactionFlags(userId, articleId);

  return {
    likes: article.likes,
    favorites: article.favorites,
    liked: flags.liked,
    favorited: flags.favorited,
  };
}

export async function toggleArticleReaction(userId, articleId, type) {
  if (!REACTION_TYPES[type]) {
    throw new Error("无效的操作类型");
  }

  const prisma = await readyDb();
  const article = await prisma.articles.findUnique({ where: { id: articleId } });
  if (!article) return null;

  const countField = COUNT_FIELDS[type];
  const reactionType = REACTION_TYPES[type];
  const compositeKey = {
    user_id_article_id_type: {
      user_id: userId,
      article_id: articleId,
      type: reactionType,
    },
  };

  const existing = await prisma.article_reactions.findUnique({
    where: compositeKey,
  });

  if (existing) {
    await prisma.article_reactions.delete({ where: compositeKey });
    await prisma.articles.update({
      where: { id: articleId },
      data: { [countField]: { decrement: 1 } },
    });
  } else {
    await prisma.article_reactions.create({
      data: {
        user_id: userId,
        article_id: articleId,
        type: reactionType,
        created_at: new Date().toISOString(),
      },
    });
    await prisma.articles.update({
      where: { id: articleId },
      data: { [countField]: { increment: 1 } },
    });
  }

  return getArticleReactionState(articleId, userId);
}
