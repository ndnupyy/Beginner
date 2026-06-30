// ============================================================
// 文件作用：与指定用户的私信会话（查询历史 / HTTP 发送）
// 访问地址：GET|POST /api/chat/with/[userId]
// 功能对应：/messages/[userId] 聊天窗口
// ============================================================

import { NextResponse } from "next/server";
import {
  getConversationWithMessages,
  sendMessageToUser,
} from "@/lib/chat";
import { getSessionUserId } from "@/lib/session";
import { broadcastToUser } from "@/lib/chatWsServer";

export async function GET(_request, { params }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { userId: peerId } = await params;
  if (!peerId || peerId === userId) {
    return NextResponse.json({ error: "无效的聊天对象" }, { status: 400 });
  }

  const data = await getConversationWithMessages(userId, peerId);
  if (!data) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function POST(request, { params }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { userId: peerId } = await params;
  if (!peerId || peerId === userId) {
    return NextResponse.json({ error: "无效的聊天对象" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const result = await sendMessageToUser(userId, peerId, body.content);

  if (!result.ok) {
    return NextResponse.json({ error: result.error || "发送失败" }, { status: 400 });
  }

  const payload = {
    type: "message",
    peerId,
    message: result.message,
  };
  broadcastToUser(userId, payload);
  broadcastToUser(peerId, payload);

  return NextResponse.json({ message: result.message });
}
