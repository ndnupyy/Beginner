// ============================================================
// 文件作用：浏览历史列表 API
// 访问地址：GET /api/history
// 维护指引：业务逻辑 → lib/history.js
// ============================================================

import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getBrowseHistory, recordBrowseHistory } from "@/lib/history";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const articles = await getBrowseHistory(userId);
  return NextResponse.json({ articles });
}

/** 记录浏览历史（每次进入详情页调用，登录用户） */
export async function POST(request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体无效" }, { status: 400 });
  }

  const articleId = body?.articleId;
  if (!articleId) {
    return NextResponse.json({ error: "缺少 articleId" }, { status: 400 });
  }

  await recordBrowseHistory(userId, articleId);
  return NextResponse.json({ ok: true });
}
