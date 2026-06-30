// ============================================================
// 文件作用：独立 WebSocket 私信服务（端口 WS_PORT，默认 3001）
// 功能对应：ws://localhost:3001/ws/chat
// 维护指引：
//   - 与 Next 协同 → scripts/dev-runner.js
//   - 消息落库 → POST http://127.0.0.1:3000/api/chat/with/[userId]
//   - 推送广播 → POST /internal/broadcast（由 lib/chatWsNotify.js 调用）
// ============================================================

const { createServer } = require("http");
const { createHmac, timingSafeEqual } = require("crypto");
const { WebSocketServer } = require("ws");

const SESSION_COOKIE = "blog_session";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "blog-dev-session-secret-change-me";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const WS_PORT = Number(process.env.WS_PORT || 3001);
const APP_PORT = Number(process.env.PORT || 3000);
const INTERNAL_SECRET =
  process.env.INTERNAL_WS_SECRET || "blog-dev-ws-internal-secret";

const clientsByUserId = new Map();

function signPayload(payload) {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

function parseSessionToken(token) {
  if (!token) return null;

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;

    const [userId, timestamp, signature] = parts;
    const payload = `${userId}:${timestamp}`;
    const expected = signPayload(payload);
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return null;
    }

    const age = Date.now() - Number(timestamp);
    if (Number.isNaN(age) || age > SESSION_MAX_AGE * 1000) {
      return null;
    }

    return userId;
  } catch {
    return null;
  }
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
  if (!clientsByUserId.has(userId)) {
    clientsByUserId.set(userId, new Set());
  }
  clientsByUserId.get(userId).add(ws);
}

function removeClient(userId, ws) {
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

function broadcastToUser(userId, payload) {
  const set = clientsByUserId.get(userId);
  if (!set) return;
  for (const ws of set) {
    sendJson(ws, payload);
  }
}

function broadcastChatMessage(payload) {
  const { peerId, message } = payload;
  if (!message) return;

  const senderId = message.senderId;
  broadcastToUser(senderId, payload);
  if (peerId && peerId !== senderId) {
    broadcastToUser(peerId, payload);
  }
}

async function persistMessageViaApi(userId, peerId, content, cookieHeader) {
  const response = await fetch(
    `http://127.0.0.1:${APP_PORT}/api/chat/with/${peerId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ content, skipBroadcast: true }),
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.error || "发送失败");
    err.code = data.code || "";
    throw err;
  }

  return data.message;
}

async function handleClientMessage(ws, userId, raw) {
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

  try {
    const message = await persistMessageViaApi(
      userId,
      peerId,
      content,
      ws.cookieHeader
    );
    const payload = { type: "message", peerId, message };
    broadcastChatMessage(payload);
    return null;
  } catch (error) {
    return {
      type: "error",
      message: error instanceof Error ? error.message : "发送失败",
      code: error.code || "",
    };
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

const httpServer = createServer(async (req, res) => {
  const { pathname } = new URL(req.url || "", "http://localhost");

  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, clients: clientsByUserId.size }));
    return;
  }

  if (pathname === "/internal/broadcast" && req.method === "POST") {
    if (req.headers["x-ws-secret"] !== INTERNAL_SECRET) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Forbidden" }));
      return;
    }

    try {
      const body = await readJsonBody(req);
      broadcastChatMessage(body);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid body" }));
    }
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

const wss = new WebSocketServer({ noServer: true });

httpServer.on("upgrade", (request, socket, head) => {
  const { pathname } = new URL(request.url || "", "http://localhost");

  if (pathname !== "/ws/chat") {
    socket.destroy();
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
    ws.cookieHeader = request.headers.cookie || "";
    addClient(userId, ws);
    sendJson(ws, { type: "connected", userId });

    ws.on("message", async (raw) => {
      const errorPayload = await handleClientMessage(
        ws,
        userId,
        raw.toString()
      );
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

httpServer.listen(WS_PORT, () => {
  console.log(`> Chat WebSocket ready on ws://127.0.0.1:${WS_PORT}/ws/chat`);
});
