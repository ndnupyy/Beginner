// ============================================================
// 文件作用：将某用户会话标记为已读
// 访问地址：POST /api/chat/with/[userId]/read
// 功能对应：打开聊天窗口时清除未读
// ============================================================

import { NextResponse } from "next/server";
import { markConversationRead } from "@/lib/chat";
import { getSessionUserId } from "@/lib/session";

export async function POST(_request, { params }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { userId: peerId } = await params;
  if (!peerId || peerId === userId) {
    return NextResponse.json({ error: "无效的聊天对象" }, { status: 400 });
  }

  const result = await markConversationRead(userId, peerId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error || "标记失败" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
