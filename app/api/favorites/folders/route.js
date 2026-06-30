// ============================================================
// 文件作用：收藏夹列表 / 新建 API
// 访问地址：
//   GET  /api/favorites/folders — 当前用户收藏夹列表
//   POST /api/favorites/folders — 新建收藏夹 { name }
// 维护指引：业务逻辑 → lib/favorites.js
// ============================================================

import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import {
  createFavoriteFolder,
  getFavoriteFolders,
} from "@/lib/favorites";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const folders = await getFavoriteFolders(userId);
  return NextResponse.json({ folders });
}

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

  try {
    const folder = await createFavoriteFolder(userId, body?.name);
    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "创建失败" },
      { status: 400 }
    );
  }
}
