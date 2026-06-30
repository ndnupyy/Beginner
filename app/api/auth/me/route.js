// ============================================================
// 文件作用：获取当前登录用户信息
// 访问地址：GET /api/auth/me
// 功能对应：导航栏显示头像和用户名 components/Header.js
// 维护指引：
//   - 导航栏不显示用户 → 本文件 + lib/session.js + Header.js
//   - 返回 401 → 未登录或 Cookie 过期
// ============================================================

import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getUserById } from "@/lib/users";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
