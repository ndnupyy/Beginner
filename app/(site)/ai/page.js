// ============================================================
// 文件作用：AI 编程助手对话页
// 访问地址：http://localhost:3000/ai
// 维护指引：界面 → components/AiChat.js
// ============================================================

import AiChat from "@/components/AiChat";
import "./ai-page.css";

export default function AiPage() {
  return (
    <div className="ai-page-root">
      <AiChat />
    </div>
  );
}
