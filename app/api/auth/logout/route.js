// ============================================================
// 文件作用：退出登录 API
// 访问地址：POST /api/auth/logout
// 功能对应：导航栏「退出」按钮 components/Header.js
// 维护指引：
//   - 退出后仍能访问受保护页 → lib/session.js clearSessionCookie + middleware.js
// ============================================================

import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ message: "已退出登录" });
}
