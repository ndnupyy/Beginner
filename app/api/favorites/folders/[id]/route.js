// ============================================================
// 文件作用：单个收藏夹重命名 / 文章列表 API
// 访问地址：
//   GET   /api/favorites/folders/[id] — 收藏夹内文章
//   PATCH /api/favorites/folders/[id] — 重命名 { name }
// 维护指引：业务逻辑 → lib/favorites.js
// ============================================================

import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import {
  getFolderArticles,
  renameFavoriteFolder,
} from "@/lib/favorites";

export async function GET(_request, { params }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const result = await getFolderArticles(userId, id);

  if (!result) {
    return NextResponse.json({ error: "收藏夹不存在" }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function PATCH(request, { params }) {
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

  try {
    const folder = await renameFavoriteFolder(userId, id, body?.name);
    return NextResponse.json({ folder });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "重命名失败" },
      { status: 400 }
    );
  }
}
