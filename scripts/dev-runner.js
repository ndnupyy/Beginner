// ============================================================
// 文件作用：同时启动 Next.js 与 WebSocket 私信服务
// 功能对应：npm run dev / npm start
// 维护指引：
//   - Next → 3000 端口
//   - WebSocket → scripts/chat-ws-server.js（WS_PORT，默认 3001）
// ============================================================

const { spawn } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
const isProd =
  process.env.NODE_ENV === "production" ||
  process.env.npm_lifecycle_event === "start";
const wsPort = process.env.WS_PORT || "3001";

const sharedEnv = {
  ...process.env,
  WS_PORT: wsPort,
  NEXT_PUBLIC_WS_PORT: wsPort,
};

const children = [];

function start(name, command, args) {
  const child = spawn(command, args, {
    cwd: root,
    env: sharedEnv,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[dev-runner] ${name} exited with code ${code}`);
    }
    shutdown(code || 0);
  });

  children.push(child);
  return child;
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

start("chat-ws", process.execPath, [path.join(__dirname, "chat-ws-server.js")]);

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
start("next", process.execPath, [nextBin, isProd ? "start" : "dev"]);

console.log(
  `[dev-runner] Next.js ${isProd ? "production" : "development"} + WebSocket chat`
);
