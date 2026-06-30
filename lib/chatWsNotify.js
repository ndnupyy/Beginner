// ============================================================
// 文件作用：通知独立 WS 服务广播新消息
// 功能对应：POST /api/chat/with/[userId] 保存消息后推送
// 维护指引：WS 进程 → scripts/chat-ws-server.js
// ============================================================

const INTERNAL_SECRET =
  process.env.INTERNAL_WS_SECRET || "blog-dev-ws-internal-secret";
const WS_PORT = Number(process.env.WS_PORT || 3001);

/**
 * 通知 WS 服务向在线用户推送消息
 * @param {{ type: string, peerId: string, message: object }} payload
 */
export async function notifyChatBroadcast(payload) {
  try {
    await fetch(`http://127.0.0.1:${WS_PORT}/internal/broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ws-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error(
      "[chat/ws-notify]",
      error instanceof Error ? error.message : "notify failed"
    );
  }
}
