// ============================================================
// 文件作用：AI 对话 API
// 访问地址：POST /api/ai/chat
// ============================================================

import { chatCompletion, normalizeChatMessages } from "@/lib/deepseek";
import { getSessionUserId } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const messages = normalizeChatMessages(body.messages);
    const reply = await chatCompletion(messages);

    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 对话失败";

    if (
      message.includes("不能为空") ||
      message.includes("无效") ||
      message.includes("不能超过") ||
      message.includes("须为用户")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (message.includes("DEEPSEEK_API_KEY")) {
      return NextResponse.json(
        { error: "AI 服务未配置，请联系管理员" },
        { status: 503 }
      );
    }

    console.error("[ai/chat]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
