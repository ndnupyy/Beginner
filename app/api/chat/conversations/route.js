// ============================================================
// 文件作用：获取当前用户的私信会话列表
// 访问地址：GET /api/chat/conversations
// 功能对应：/messages 左侧会话列表
// ============================================================

import { NextResponse } from "next/server";
import { listConversations } from "@/lib/chat";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const conversations = await listConversations(userId);
  return NextResponse.json({ conversations });
}
