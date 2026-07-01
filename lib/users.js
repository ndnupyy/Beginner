// ============================================================
// 文件作用：用户数据读写（Prisma Service 层）
// 功能对应：注册、登录、找回密码、更换头像
// 维护指引：
//   - 用户 CRUD → 本文件
//   - 表结构 → prisma/schema.prisma
//   - 密码哈希 → lib/password.js
// ============================================================

import { readyDb } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

function rowToUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    avatarUrl: row.avatar_url,
    profileBackgroundUrl: row.profile_background_url || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUserById(id) {
  const prisma = await readyDb();
  const row = await prisma.users.findUnique({ where: { id } });
  return row ? rowToUser(row) : null;
}

/** 返回含 password_hash 的原始行（登录校验用） */
export async function getUserByUsername(username) {
  const prisma = await readyDb();
  const rows = await prisma.$queryRaw`
    SELECT * FROM users WHERE username = ${username} COLLATE NOCASE LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getUserByEmail(email) {
  const prisma = await readyDb();
  const rows = await prisma.$queryRaw`
    SELECT * FROM users WHERE email = ${email} COLLATE NOCASE LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getUserByLogin(login) {
  const prisma = await readyDb();
  const rows = await prisma.$queryRaw`
    SELECT * FROM users
    WHERE username = ${login} COLLATE NOCASE
       OR email = ${login} COLLATE NOCASE
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function createUser({ username, email, password, avatarUrl }) {
  const prisma = await readyDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await prisma.users.create({
    data: {
      id,
      username,
      email,
      password_hash: hashPassword(password),
      avatar_url: avatarUrl || "/default-avatar.svg",
      created_at: now,
      updated_at: now,
    },
  });

  return getUserById(id);
}

export async function updateUserPassword(id, password) {
  const prisma = await readyDb();
  const now = new Date().toISOString();

  try {
    await prisma.users.update({
      where: { id },
      data: {
        password_hash: hashPassword(password),
        updated_at: now,
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function resetPasswordByUsername(username, newPassword) {
  const trimmed = (username || "").trim();
  if (!trimmed) {
    return { ok: false, error: "请输入用户名" };
  }

  const user = await getUserByUsername(trimmed);
  if (!user) {
    return { ok: false, error: "用户名不存在，请检查后重试" };
  }

  const updated = await updateUserPassword(user.id, newPassword);
  if (!updated) {
    return { ok: false, error: "密码修改失败，请稍后再试" };
  }

  return { ok: true };
}

export async function updateUserAvatar(userId, avatarUrl) {
  const prisma = await readyDb();
  const user = await getUserById(userId);
  if (!user) return null;

  const now = new Date().toISOString();

  await prisma.$transaction([
    prisma.users.update({
      where: { id: userId },
      data: { avatar_url: avatarUrl, updated_at: now },
    }),
    prisma.articles.updateMany({
      where: { author_id: userId },
      data: {
        author_avatar: avatarUrl,
        author_name: user.username,
        updated_at: now,
      },
    }),
  ]);

  return getUserById(userId);
}

/**
 * 更新用户主页背景图
 * @param {string} userId
 * @param {string} profileBackgroundUrl - 空字符串表示恢复默认
 */
export async function updateUserProfileBackground(userId, profileBackgroundUrl) {
  const prisma = await readyDb();
  const user = await getUserById(userId);
  if (!user) return null;

  const now = new Date().toISOString();

  await prisma.users.update({
    where: { id: userId },
    data: {
      profile_background_url: profileBackgroundUrl || "",
      updated_at: now,
    },
  });

  return getUserById(userId);
}
