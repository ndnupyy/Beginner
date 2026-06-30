// ============================================================
// 文件作用：返回客户端应连接的 WebSocket 地址
// 访问地址：GET /api/chat/ws-config
// 功能对应：components/useChatWebSocket.js
// ============================================================

import { NextResponse } from "next/server";

export async function GET(request) {
  const wsPort = process.env.NEXT_PUBLIC_WS_PORT || process.env.WS_PORT || "";
  const host = request.headers.get("host") || "localhost:3000";
  const hostname = host.split(":")[0];
  const protocol =
    request.headers.get("x-forwarded-proto") === "https" ? "wss" : "ws";

  const url = wsPort
    ? `${protocol}://${hostname}:${wsPort}/ws/chat`
    : `${protocol}://${host}/ws/chat`;

  return NextResponse.json({ url, wsPort: wsPort || null });
}
