// ============================================================
// 文件作用：文章数据读写（Prisma Service 层）
// 功能对应：所有 CRUD 操作
// 维护指引：
//   - 文章 CRUD → 本文件
//   - 表结构 → prisma/schema.prisma
//   - 作者头像实时同步 → enrichArticle + lib/users.js
// ============================================================

import { readyDb } from "@/lib/prisma";
import { getUserById } from "@/lib/users";

function rowToArticle(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    summary: row.summary,
    tags: JSON.parse(row.tags || "[]"),
    thumbnailUrl: row.thumbnail_url,
    category: row.category,
    articleType: row.article_type,
    visibility: row.visibility,
    authorName: row.author_name,
    authorAvatar: row.author_avatar,
    views: row.views,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function enrichArticle(row) {
  const article = rowToArticle(row);

  if (row.author_id) {
    const user = await getUserById(row.author_id);
    if (user) {
      article.authorName = user.username;
      article.authorAvatar = user.avatarUrl;
    }
  }

  return article;
}

export async function getAllArticles() {
  const prisma = await readyDb();
  const rows = await prisma.articles.findMany({
    orderBy: { created_at: "desc" },
  });
  return Promise.all(rows.map(enrichArticle));
}

export async function getArticleById(id) {
  const prisma = await readyDb();
  const row = await prisma.articles.findUnique({ where: { id } });
  return row ? await enrichArticle(row) : null;
}

export async function createArticle(articleData) {
  const prisma = await readyDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const row = await prisma.articles.create({
    data: {
      id,
      title: articleData.title || "",
      content: articleData.content || "",
      summary: articleData.summary || "",
      tags: JSON.stringify(articleData.tags || []),
      thumbnail_url: articleData.thumbnailUrl || "",
      category: articleData.category || "",
      article_type: articleData.articleType || "原创",
      visibility: articleData.visibility || "全部可见",
      author_id: articleData.authorId || null,
      author_name: articleData.authorName || "博客作者",
      author_avatar: articleData.authorAvatar || "/default-avatar.svg",
      views: 0,
      created_at: now,
      updated_at: now,
    },
  });

  return await enrichArticle(row);
}

export async function updateArticle(id, updates) {
  const existing = await getArticleById(id);
  if (!existing) return null;

  const data = { updated_at: new Date().toISOString() };

  if (updates.title !== undefined) data.title = updates.title;
  if (updates.content !== undefined) data.content = updates.content;
  if (updates.summary !== undefined) data.summary = updates.summary;
  if (updates.tags !== undefined) data.tags = JSON.stringify(updates.tags);
  if (updates.thumbnailUrl !== undefined) data.thumbnail_url = updates.thumbnailUrl;
  if (updates.category !== undefined) data.category = updates.category;
  if (updates.articleType !== undefined) data.article_type = updates.articleType;
  if (updates.visibility !== undefined) data.visibility = updates.visibility;
  if (updates.authorName !== undefined) data.author_name = updates.authorName;
  if (updates.authorAvatar !== undefined) data.author_avatar = updates.authorAvatar;
  if (updates.views !== undefined) data.views = updates.views;

  const prisma = await readyDb();
  await prisma.articles.update({ where: { id }, data });

  return getArticleById(id);
}

export async function deleteArticle(id) {
  const prisma = await readyDb();
  try {
    await prisma.articles.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function incrementViews(id) {
  const article = await getArticleById(id);
  if (!article) return null;
  return updateArticle(id, { views: article.views + 1 });
}
