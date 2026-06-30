// ============================================================
// 文件作用：文章点赞 / 收藏（用户级 toggle + 计数）
// 功能对应：详情页点赞收藏、首页展示数量
// 维护指引：
//   - 收藏夹逻辑 → lib/favorites.js
//   - 表结构 → prisma/schema.prisma article_reactions / favorite_items
//   - API → app/api/articles/[id]/reactions/route.js
// ============================================================

import { readyDb } from "@/lib/prisma";
import { getArticleById } from "@/lib/articles";
import {
  addFavoriteToFolder,
  ensureDefaultFolder,
  getFavoriteFolders,
  isArticleFavorited,
  removeFavorite,
} from "@/lib/favorites";

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

  const favorited = await isArticleFavorited(userId, articleId);

  return {
    liked: rows.some((row) => row.type === REACTION_TYPES.like),
    favorited,
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

async function toggleLike(userId, articleId) {
  const prisma = await readyDb();
  const article = await prisma.articles.findUnique({ where: { id: articleId } });
  if (!article) return null;

  const compositeKey = {
    user_id_article_id_type: {
      user_id: userId,
      article_id: articleId,
      type: REACTION_TYPES.like,
    },
  };

  const existing = await prisma.article_reactions.findUnique({
    where: compositeKey,
  });

  if (existing) {
    await prisma.article_reactions.delete({ where: compositeKey });
    await prisma.articles.update({
      where: { id: articleId },
      data: { likes: { decrement: 1 } },
    });
  } else {
    await prisma.article_reactions.create({
      data: {
        user_id: userId,
        article_id: articleId,
        type: REACTION_TYPES.like,
        created_at: new Date().toISOString(),
      },
    });
    await prisma.articles.update({
      where: { id: articleId },
      data: { likes: { increment: 1 } },
    });
  }

  return getArticleReactionState(articleId, userId);
}

/**
 * 切换收藏状态；多收藏夹时需传入 folderId，否则返回需选择收藏夹
 * @returns {Promise<object|null|{ needFolderSelection: true, folders: array }>}
 */
export async function toggleArticleReaction(userId, articleId, type, folderId) {
  if (!REACTION_TYPES[type]) {
    throw new Error("无效的操作类型");
  }

  if (type === REACTION_TYPES.like) {
    return toggleLike(userId, articleId);
  }

  const favorited = await isArticleFavorited(userId, articleId);

  if (favorited) {
    await removeFavorite(userId, articleId);
    return getArticleReactionState(articleId, userId);
  }

  const folders = await getFavoriteFolders(userId);

  if (folders.length > 1 && !folderId) {
    return {
      needFolderSelection: true,
      folders: folders.map(({ id, name, isDefault }) => ({
        id,
        name,
        isDefault,
      })),
    };
  }

  let targetFolderId = folderId;
  if (!targetFolderId) {
    const defaultFolder = folders.find((folder) => folder.isDefault) ||
      (await ensureDefaultFolder(userId));
    targetFolderId = defaultFolder.id;
  }

  await addFavoriteToFolder(userId, articleId, targetFolderId);
  return getArticleReactionState(articleId, userId);
}
