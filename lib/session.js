// ============================================================
// 文件作用：用户登录会话（Cookie）的创建、校验与清除
// 功能对应：登录成功后写入 Cookie；API 读取当前用户；退出登录
// 维护指引：
//   - 登录成功但刷新后掉线 → 本文件 setSessionCookie / Cookie 配置
//   - 会话过期时间不对 → 修改 SESSION_MAX_AGE
//   - 生产环境安全 → 设置环境变量 SESSION_SECRET
//   - 路由拦截未登录 → middleware.js（Edge 环境有独立校验逻辑）
// ============================================================

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "blog_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const SESSION_SECRET =
  process.env.SESSION_SECRET || "blog-dev-session-secret-change-me";

function signPayload(payload) {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

export function createSessionToken(userId) {
  const timestamp = String(Date.now());
  const payload = `${userId}:${timestamp}`;
  const signature = signPayload(payload);
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function parseSessionToken(token) {
  if (!token) return null;

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;

    const [userId, timestamp, signature] = parts;
    const payload = `${userId}:${timestamp}`;
    const expected = signPayload(payload);

    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return null;
    }

    const age = Date.now() - Number(timestamp);
    if (Number.isNaN(age) || age > SESSION_MAX_AGE * 1000) {
      return null;
    }

    return userId;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId) {
  const token = createSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return parseSessionToken(token);
}

export { SESSION_COOKIE };
