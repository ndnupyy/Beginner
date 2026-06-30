// ============================================================
// 文件作用：拉黑 / 取消拉黑用户
// 访问地址：POST /api/users/[id]/block
// 功能对应：私信页拉黑按钮
// ============================================================

import { NextResponse } from "next/server";
import { toggleBlock } from "@/lib/blocks";
import { getSessionUserId } from "@/lib/session";

export async function POST(_request, { params }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id: peerId } = await params;
  if (!peerId || peerId === userId) {
    return NextResponse.json({ error: "无效用户" }, { status: 400 });
  }

  const result = await toggleBlock(userId, peerId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error || "操作失败" }, { status: 400 });
  }

  return NextResponse.json({ blocked: result.blocked });
}
