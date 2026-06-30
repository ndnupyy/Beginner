// ============================================================
// 文件作用：获取当前用户私信未读数
// 访问地址：GET /api/chat/unread
// 功能对应：Header 未读角标、ChatUnreadListener
// ============================================================

import { NextResponse } from "next/server";
import { getUnreadSummary } from "@/lib/chat";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const summary = await getUnreadSummary(userId);
  return NextResponse.json(summary);
}
