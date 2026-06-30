// ============================================================
// 文件作用：WebSocket 私信服务（连接管理 + 实时推送）
// 功能对应：ws://host/ws/chat，server.js 挂载
// 维护指引：
//   - 消息落库 → lib/chat.js
//   - 会话 Cookie → lib/session.js parseSessionToken
// ============================================================

import { WebSocketServer } from "ws";
import { parseSessionToken, SESSION_COOKIE } from "@/lib/session";
import { sendMessageToUser } from "@/lib/chat";

const globalForWs = globalThis;

function getClientMap() {
  if (!globalForWs.__chatClientsByUserId) {
    globalForWs.__chatClientsByUserId = new Map();
  }
  return globalForWs.__chatClientsByUserId;
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((acc, part) => {
    const trimmed = part.trim();
    if (!trimmed) return acc;
    const index = trimmed.indexOf("=");
    if (index <= 0) return acc;
    acc[trimmed.slice(0, index)] = decodeURIComponent(trimmed.slice(index + 1));
    return acc;
  }, {});
}

function addClient(userId, ws) {
  const clientsByUserId = getClientMap();
  if (!clientsByUserId.has(userId)) {
    clientsByUserId.set(userId, new Set());
  }
  clientsByUserId.get(userId).add(ws);
}

function removeClient(userId, ws) {
  const clientsByUserId = getClientMap();
  const set = clientsByUserId.get(userId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) {
    clientsByUserId.delete(userId);
  }
}

function sendJson(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

export function broadcastToUser(userId, payload) {
  const clientsByUserId = getClientMap();
  const set = clientsByUserId.get(userId);
  if (!set) return;
  for (const ws of set) {
    sendJson(ws, payload);
  }
}

async function handleClientMessage(userId, raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { type: "error", message: "消息格式无效" };
  }

  if (data.type !== "send") {
    return { type: "error", message: "不支持的消息类型" };
  }

  const peerId = String(data.peerId || "").trim();
  const content = String(data.content || "").trim();
  if (!peerId || !content) {
    return { type: "error", message: "缺少接收人或消息内容" };
  }

  const result = await sendMessageToUser(userId, peerId, content);
  if (!result.ok) {
    return { type: "error", message: result.error || "发送失败" };
  }

  const payload = {
    type: "message",
    peerId,
    message: result.message,
  };

  broadcastToUser(userId, payload);
  broadcastToUser(peerId, payload);

  return null;
}

/**
 * 在 HTTP Server 上挂载 WebSocket 私信通道
 * @param {import('http').Server} httpServer
 */
export function setupChatWebSocket(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url || "", "http://localhost");

    if (pathname !== "/ws/chat") {
      return;
    }

    const cookies = parseCookies(request.headers.cookie);
    const userId = parseSessionToken(cookies[SESSION_COOKIE]);
    if (!userId) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.userId = userId;
      addClient(userId, ws);
      sendJson(ws, { type: "connected", userId });

      ws.on("message", async (raw) => {
        const errorPayload = await handleClientMessage(userId, raw.toString());
        if (errorPayload) {
          sendJson(ws, errorPayload);
        }
      });

      ws.on("close", () => {
        removeClient(userId, ws);
      });

      ws.on("error", () => {
        removeClient(userId, ws);
      });
    });
  });

  return wss;
}
