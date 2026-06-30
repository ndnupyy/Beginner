// ============================================================
// 文件作用：收藏夹与收藏文章（文件夹 CRUD、收藏/取消、列表）
// 功能对应：/favorites 页、文章详情收藏按钮
// 维护指引：
//   - 表结构 → prisma/schema.prisma favorite_folders / favorite_items
//   - API → app/api/favorites/
//   - 收藏 toggle 与计数 → lib/reactions.js
// ============================================================

import { readyDb } from "@/lib/prisma";
import { enrichArticleFromRow } from "@/lib/articles";

const DEFAULT_FOLDER_NAME = "默认收藏夹";

function rowToFolder(row, itemCount = 0) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    isDefault: Boolean(row.is_default),
    itemCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 将旧版 article_reactions 收藏记录迁移到默认收藏夹（仅执行一次） */
async function migrateLegacyFavorites(userId, defaultFolderId) {
  const prisma = await readyDb();
  const legacyRows = await prisma.article_reactions.findMany({
    where: { user_id: userId, type: "favorite" },
    select: { article_id: true, created_at: true },
  });

  if (legacyRows.length === 0) return;

  for (const row of legacyRows) {
    const existing = await prisma.favorite_items.findUnique({
      where: {
        user_id_article_id: {
          user_id: userId,
          article_id: row.article_id,
        },
      },
    });

    if (!existing) {
      await prisma.favorite_items.create({
        data: {
          user_id: userId,
          article_id: row.article_id,
          folder_id: defaultFolderId,
          created_at: row.created_at,
        },
      });
    }
  }
}

/** 确保用户拥有默认收藏夹，不存在则创建 */
export async function ensureDefaultFolder(userId) {
  const prisma = await readyDb();
  let folder = await prisma.favorite_folders.findFirst({
    where: { user_id: userId, is_default: 1 },
  });

  if (!folder) {
    const now = new Date().toISOString();
    folder = await prisma.favorite_folders.create({
      data: {
        id: crypto.randomUUID(),
        user_id: userId,
        name: DEFAULT_FOLDER_NAME,
        is_default: 1,
        created_at: now,
        updated_at: now,
      },
    });
  }

  await migrateLegacyFavorites(userId, folder.id);
  return rowToFolder(folder, 0);
}

/** 获取用户全部收藏夹（含每夹文章数） */
export async function getFavoriteFolders(userId) {
  if (!userId) return [];

  await ensureDefaultFolder(userId);

  const prisma = await readyDb();
  const rows = await prisma.favorite_folders.findMany({
    where: { user_id: userId },
    orderBy: [{ is_default: "desc" }, { created_at: "asc" }],
  });

  const folders = await Promise.all(
    rows.map(async (row) => {
      const itemCount = await prisma.favorite_items.count({
        where: { folder_id: row.id },
      });
      return rowToFolder(row, itemCount);
    })
  );

  return folders;
}

/** 新建收藏夹 */
export async function createFavoriteFolder(userId, name) {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    throw new Error("收藏夹名称不能为空");
  }
  if (trimmed.length > 30) {
    throw new Error("收藏夹名称不能超过 30 个字符");
  }

  const prisma = await readyDb();
  const duplicate = await prisma.favorite_folders.findFirst({
    where: { user_id: userId, name: trimmed },
  });
  if (duplicate) {
    throw new Error("已存在同名收藏夹");
  }

  const now = new Date().toISOString();
  const row = await prisma.favorite_folders.create({
    data: {
      id: crypto.randomUUID(),
      user_id: userId,
      name: trimmed,
      is_default: 0,
      created_at: now,
      updated_at: now,
    },
  });

  return rowToFolder(row, 0);
}

/** 重命名收藏夹（默认收藏夹也可改名） */
export async function renameFavoriteFolder(userId, folderId, name) {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    throw new Error("收藏夹名称不能为空");
  }
  if (trimmed.length > 30) {
    throw new Error("收藏夹名称不能超过 30 个字符");
  }

  const prisma = await readyDb();
  const folder = await prisma.favorite_folders.findFirst({
    where: { id: folderId, user_id: userId },
  });
  if (!folder) {
    throw new Error("收藏夹不存在");
  }

  const duplicate = await prisma.favorite_folders.findFirst({
    where: {
      user_id: userId,
      name: trimmed,
      NOT: { id: folderId },
    },
  });
  if (duplicate) {
    throw new Error("已存在同名收藏夹");
  }

  const now = new Date().toISOString();
  const updated = await prisma.favorite_folders.update({
    where: { id: folderId },
    data: { name: trimmed, updated_at: now },
  });

  const itemCount = await prisma.favorite_items.count({
    where: { folder_id: folderId },
  });

  return rowToFolder(updated, itemCount);
}

/** 判断用户是否已收藏某文章 */
export async function isArticleFavorited(userId, articleId) {
  if (!userId || !articleId) return false;

  const prisma = await readyDb();
  const row = await prisma.favorite_items.findUnique({
    where: {
      user_id_article_id: {
        user_id: userId,
        article_id: articleId,
      },
    },
  });

  return Boolean(row);
}

/** 获取收藏夹内的已发布文章列表 */
export async function getFolderArticles(userId, folderId) {
  const prisma = await readyDb();
  const folder = await prisma.favorite_folders.findFirst({
    where: { id: folderId, user_id: userId },
  });
  if (!folder) return null;

  const items = await prisma.favorite_items.findMany({
    where: { folder_id: folderId, user_id: userId },
    orderBy: { created_at: "desc" },
    include: { article: true },
  });

  const articles = [];
  for (const item of items) {
    if (!item.article || item.article.status !== "published") continue;
    articles.push(await enrichArticleFromRow(item.article));
  }

  return {
    folder: rowToFolder(folder, articles.length),
    articles,
  };
}

/** 收藏文章到指定收藏夹 */
export async function addFavoriteToFolder(userId, articleId, folderId) {
  const prisma = await readyDb();
  const article = await prisma.articles.findUnique({ where: { id: articleId } });
  if (!article || article.status !== "published") {
    throw new Error("文章不存在或未发布");
  }

  const folder = await prisma.favorite_folders.findFirst({
    where: { id: folderId, user_id: userId },
  });
  if (!folder) {
    throw new Error("收藏夹不存在");
  }

  const existing = await prisma.favorite_items.findUnique({
    where: {
      user_id_article_id: {
        user_id: userId,
        article_id: articleId,
      },
    },
  });

  const now = new Date().toISOString();

  if (existing) {
    if (existing.folder_id === folderId) {
      return { added: false, moved: false };
    }

    await prisma.favorite_items.update({
      where: {
        user_id_article_id: {
          user_id: userId,
          article_id: articleId,
        },
      },
      data: { folder_id: folderId },
    });

    return { added: false, moved: true };
  }

  await prisma.$transaction([
    prisma.favorite_items.create({
      data: {
        user_id: userId,
        article_id: articleId,
        folder_id: folderId,
        created_at: now,
      },
    }),
    prisma.articles.update({
      where: { id: articleId },
      data: { favorites: { increment: 1 } },
    }),
    prisma.article_reactions.upsert({
      where: {
        user_id_article_id_type: {
          user_id: userId,
          article_id: articleId,
          type: "favorite",
        },
      },
      create: {
        user_id: userId,
        article_id: articleId,
        type: "favorite",
        created_at: now,
      },
      update: {},
    }),
  ]);

  return { added: true, moved: false };
}

/** 取消收藏 */
export async function removeFavorite(userId, articleId) {
  const prisma = await readyDb();
  const existing = await prisma.favorite_items.findUnique({
    where: {
      user_id_article_id: {
        user_id: userId,
        article_id: articleId,
      },
    },
  });

  if (!existing) {
    return false;
  }

  await prisma.$transaction([
    prisma.favorite_items.delete({
      where: {
        user_id_article_id: {
          user_id: userId,
          article_id: articleId,
        },
      },
    }),
    prisma.article_reactions.deleteMany({
      where: {
        user_id: userId,
        article_id: articleId,
        type: "favorite",
      },
    }),
    prisma.articles.update({
      where: { id: articleId },
      data: { favorites: { decrement: 1 } },
    }),
  ]);

  return true;
}
