// ============================================================
// 文件作用：用户数据的数据库读写（Service 层）
// 功能对应：注册、登录、找回密码、读取当前用户
// 数据存储：SQLite 表 users（见 lib/db.js），字段含 id、username、password_hash 等
// 维护指引：
//   - 用户名/邮箱重复、查不到用户 → 本文件对应 get/create 函数
//   - 找回密码必须用户名匹配 → resetPasswordByUsername
//   - 用户表结构变更 → lib/db.js users 表 + 本文件
//   - 密码哈希 → lib/password.js
// ============================================================

import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/password";

/**
 * 数据库行转前端用户对象（不含 password_hash）
 * @param {Object} row - SQLite 查询结果
 * @returns {Object} camelCase 用户对象
 */
function rowToUser(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 按 ID 查询用户（GET /api/auth/me 等） */
export function getUserById(id) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  return row ? rowToUser(row) : null;
}

/** 按用户名查询（注册时检查重复，返回含 password_hash 的原始行） */
export function getUserByUsername(username) {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE")
    .get(username);
  return row || null;
}

/** 按邮箱查询（注册时检查重复） */
export function getUserByEmail(email) {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
    .get(email);
  return row || null;
}

/** 按用户名或邮箱登录（登录 API 使用） */
export function getUserByLogin(login) {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT * FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE"
    )
    .get(login, login);
  return row || null;
}

/**
 * 创建新用户（注册 API）
 * @param {Object} params - username, email, password, avatarUrl
 * @returns {Object} 不含密码的用户对象
 */
export function createUser({ username, email, password, avatarUrl }) {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO users (
      id, username, email, password_hash, avatar_url, created_at, updated_at
    ) VALUES (
      @id, @username, @email, @password_hash, @avatar_url, @created_at, @updated_at
    )`
  ).run({
    id,
    username,
    email,
    password_hash: hashPassword(password),
    avatar_url: avatarUrl || "/default-avatar.svg",
    created_at: now,
    updated_at: now,
  });

  return getUserById(id);
}

/** 更新指定 id 用户的密码（内部按 SQLite 主键 id 更新） */
export function updateUserPassword(id, password) {
  const db = getDb();
  const now = new Date().toISOString();

  const result = db
    .prepare(
      "UPDATE users SET password_hash = @password_hash, updated_at = @updated_at WHERE id = @id"
    )
    .run({
      id,
      password_hash: hashPassword(password),
      updated_at: now,
    });

  return result.changes > 0;
}

/**
 * 找回密码：先在 SQLite users 表中按用户名检索 id，匹配成功才修改密码
 * @param {string} username - 用户输入的用户名（必须与库中完全一致，忽略大小写）
 * @param {string} newPassword - 新密码明文
 * @returns {{ ok: boolean, error?: string }} ok 为 false 时 error 为页面应显示的报错
 */
export function resetPasswordByUsername(username, newPassword) {
  const trimmed = (username || "").trim();
  if (!trimmed) {
    return { ok: false, error: "请输入用户名" };
  }

  // 第一步：在 users 表中按 username 检索，拿到该用户的 id
  const user = getUserByUsername(trimmed);
  if (!user) {
    return { ok: false, error: "用户名不存在，请检查后重试" };
  }

  // 第二步：仅当 id 存在且匹配时，按 id 更新 password_hash
  const updated = updateUserPassword(user.id, newPassword);
  if (!updated) {
    return { ok: false, error: "密码修改失败，请稍后再试" };
  }

  return { ok: true };
}

/** 更新用户头像 URL，并同步该用户所有已发布文章的作者头像 */
export function updateUserAvatar(userId, avatarUrl) {
  const db = getDb();
  const now = new Date().toISOString();
  const user = getUserById(userId);
  if (!user) return null;

  db.prepare(
    "UPDATE users SET avatar_url = @avatar_url, updated_at = @updated_at WHERE id = @id"
  ).run({
    id: userId,
    avatar_url: avatarUrl,
    updated_at: now,
  });

  db.prepare(
    `UPDATE articles SET
      author_avatar = @author_avatar,
      author_name = @author_name,
      updated_at = @updated_at
    WHERE author_id = @author_id`
  ).run({
    author_id: userId,
    author_avatar: avatarUrl,
    author_name: user.username,
    updated_at: now,
  });

  return getUserById(userId);
}
