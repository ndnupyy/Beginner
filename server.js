// ============================================================
// 文件作用：Next.js 自定义 HTTP 服务 + WebSocket 私信
// 功能对应：npm run dev / npm start；/ws/chat 实时聊天
// 维护指引：
//   - WebSocket 逻辑 → lib/chatWsServer.js
//   - 页面与 API 仍由 Next 处理
// ============================================================

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = Number(process.env.PORT || 3000);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  const { setupChatWebSocket } = await import("./lib/chatWsServer.js");

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  setupChatWebSocket(server);

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket chat on ws://${hostname}:${port}/ws/chat`);
  });
});
