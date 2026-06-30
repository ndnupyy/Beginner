// ============================================================
// 文件作用：为文章作者创建/绑定注册用户（支持关注功能）
// 功能对应：启动时回填 author_id
// 注意：本文件必须使用 prisma 直连，不能调用 readyDb()（避免与 ensureSeeded 死锁）
// ============================================================

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

function buildSeedAuthorEmail(authorName) {
  const slug = Buffer.from(authorName, "utf8")
    .toString("base64url")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 24);
  return `author.${slug || "default"}@seed.local`;
}

async function findUserByUsername(username) {
  const rows = await prisma.$queryRaw`
    SELECT id FROM users WHERE username = ${username} COLLATE NOCASE LIMIT 1
  `;
  return rows[0] ?? null;
}

async function ensureAuthorUser(authorName, avatarUrl) {
  const name = authorName?.trim() || "博客作者";
  const existing = await findUserByUsername(name);
  if (existing) return existing.id;

  const email = buildSeedAuthorEmail(name);
  const existingByEmail = await prisma.users.findUnique({ where: { email } });
  if (existingByEmail) return existingByEmail.id;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await prisma.users.create({
    data: {
      id,
      username: name,
      email,
      password_hash: hashPassword(crypto.randomUUID()),
      avatar_url: avatarUrl || "/default-avatar.svg",
      created_at: now,
      updated_at: now,
    },
  });

  return id;
}

/** 为缺少 author_id 的文章创建作者账号并回填 */
export async function ensureArticleAuthors() {
  const rows = await prisma.articles.findMany({
    where: { author_id: null },
    select: { author_name: true, author_avatar: true },
  });

  if (rows.length === 0) return;

  const authorMap = new Map();
  for (const row of rows) {
    const name = row.author_name?.trim() || "博客作者";
    if (!authorMap.has(name)) {
      authorMap.set(name, row.author_avatar || "/default-avatar.svg");
    }
  }

  for (const [authorName, avatarUrl] of authorMap) {
    const userId = await ensureAuthorUser(authorName, avatarUrl);
    if (!userId) continue;

    await prisma.articles.updateMany({
      where: {
        author_id: null,
        author_name: authorName,
      },
      data: { author_id: userId },
    });
  }
}

/** 同步已有 author_id 文章的 author_name 与注册用户一致 */
export async function syncArticleAuthorNames() {
  const rows = await prisma.articles.findMany({
    where: { author_id: { not: null } },
    select: { id: true, author_id: true, author_name: true, author_avatar: true },
  });

  for (const row of rows) {
    const author = await prisma.users.findUnique({
      where: { id: row.author_id },
      select: { username: true, avatar_url: true },
    });
    if (!author) continue;

    const avatar = author.avatar_url || "/default-avatar.svg";
    if (row.author_name !== author.username || row.author_avatar !== avatar) {
      await prisma.articles.update({
        where: { id: row.id },
        data: {
          author_name: author.username,
          author_avatar: avatar,
        },
      });
    }
  }
}

export async function ensureAuthorLinks() {
  await ensureArticleAuthors();
  await syncArticleAuthorNames();
}
