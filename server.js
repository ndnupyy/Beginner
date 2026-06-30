// ============================================================
// 文件作用：Next.js 自定义 HTTP 服务（已弃用，请用 scripts/dev-runner.js）
// 功能对应：历史遗留；当前请使用 npm run dev
// ============================================================

console.warn(
  "[server.js] 已弃用，请使用 npm run dev（scripts/dev-runner.js）启动 Next + WebSocket。"
);

const { spawn } = require("child_process");
const path = require("path");

spawn(process.execPath, [path.join(__dirname, "scripts", "dev-runner.js")], {
  stdio: "inherit",
  cwd: __dirname,
});

