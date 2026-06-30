// ============================================================
// 文件作用：文章点赞 / 收藏 API
// 访问地址：
//   GET  /api/articles/[id]/reactions — 获取数量与当前用户状态
//   POST /api/articles/[id]/reactions — toggle 点赞或收藏
// 维护指引：业务逻辑 → lib/reactions.js
// ============================================================

import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import {
  getArticleReactionState,
  toggleArticleReaction,
} from "@/lib/reactions";

export async function GET(_request, { params }) {
  const { id } = await params;
  const userId = await getSessionUserId();
  const state = await getArticleReactionState(id, userId);

  if (!state) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  return NextResponse.json(state);
}

export async function POST(request, { params }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体无效" }, { status: 400 });
  }

  const type = body?.type;
  if (type !== "like" && type !== "favorite") {
    return NextResponse.json({ error: "type 必须为 like 或 favorite" }, {
      status: 400,
    });
  }

  const folderId = body?.folderId || null;

  try {
    const state = await toggleArticleReaction(userId, id, type, folderId);
    if (!state) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    if (state.needFolderSelection) {
      return NextResponse.json(state, { status: 409 });
    }

    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "操作失败" },
      { status: 400 }
    );
  }
}
