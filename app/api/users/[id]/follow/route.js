// ============================================================
// 文件作用：用户关注 API
// 访问地址：
//   GET  /api/users/[id]/follow — 是否已关注 + 粉丝数
//   POST /api/users/[id]/follow — 关注 / 取消关注
// ============================================================

import { NextResponse } from "next/server";
import { getFollowState, toggleFollow } from "@/lib/follows";
import { getSessionUserId } from "@/lib/session";

export async function GET(_request, { params }) {
  const { id: followingId } = await params;
  const followerId = await getSessionUserId();
  const state = await getFollowState(followerId, followingId);
  return NextResponse.json(state);
}

export async function POST(_request, { params }) {
  try {
    const followerId = await getSessionUserId();
    if (!followerId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id: followingId } = await params;
    const state = await toggleFollow(followerId, followingId);
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "操作失败" },
      { status: 400 }
    );
  }
}
