// ============================================================
// 文件作用：全局路由中间件 — 未登录拦截与跳转
// 功能对应：保护首页、文章页、写文章等；放行 /login 和 /api/auth/*
// 维护指引：
//   - 未登录仍能访问某页 → 检查 isPublicPath 是否误放行
//   - 已登录仍被踢到登录页 → parseSessionToken 与 lib/session.js 密钥是否一致
//   - 某路径应对外公开 → 加入 PUBLIC_PATHS 或 isPublicPath 条件
//   - API 未登录应返回 401 而非跳转 → 本文件 pathname.startsWith("/api/") 分支
// ============================================================

import { NextResponse } from "next/server";

// 与 lib/session.js 中 SESSION_COOKIE 保持一致
const SESSION_COOKIE = "blog_session";
// 与 lib/session.js 中 SESSION_SECRET 保持一致（middleware 在 Edge 运行，需独立实现签名校验）
const SESSION_SECRET =
  process.env.SESSION_SECRET || "blog-dev-session-secret-change-me";
// 会话最长 7 天（秒）
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

// 无需登录即可访问的路径前缀
const PUBLIC_PATHS = ["/login"];

/**
 * 判断当前路径是否允许未登录访问
 * @param {string} pathname - 如 /、/login、/api/auth/login
 */
function isPublicPath(pathname) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/uploads")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/default-avatar.svg") return true;
  return false;
}

/** base64url 解码（Edge 环境无 Node Buffer 时的 atob 方案） */
function decodeBase64Url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return atob(padded + pad);
}

/** 使用 Web Crypto 做 HMAC-SHA256，结果与 Node createHmac 的 hex 一致 */
async function signPayload(payload) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** 校验 Cookie token，成功返回 userId（Edge 兼容版，逻辑同 lib/session.js） */
async function parseSessionToken(token) {
  if (!token) return null;

  try {
    const decoded = decodeBase64Url(token);
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;

    const [userId, timestamp, signature] = parts;
    const payload = `${userId}:${timestamp}`;
    const expected = await signPayload(payload);

    if (signature !== expected) return null;

    const age = Date.now() - Number(timestamp);
    if (Number.isNaN(age) || age > SESSION_MAX_AGE * 1000) {
      return null;
    }

    return userId;
  } catch {
    return null;
  }
}

/**
 * Next.js 中间件入口：每个匹配的请求都会经过
 * @param {import("next/server").NextRequest} request
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const userId = await parseSessionToken(token);
  const isLoggedIn = Boolean(userId);

  // 已登录用户访问登录页 → 重定向首页
  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 未登录且非公开路径 → 拦截
  if (!isPublicPath(pathname) && !isLoggedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// 匹配除静态资源外的所有路径
export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
