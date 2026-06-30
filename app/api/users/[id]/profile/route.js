// ============================================================
// 文件作用：用户个人主页 API
// 访问地址：GET /api/users/[id]/profile
// 维护指引：业务逻辑 → lib/profile.js
// ============================================================

import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getUserProfile } from "@/lib/profile";

export async function GET(_request, { params }) {
  const { id } = await params;
  const viewerId = await getSessionUserId();
  const profile = await getUserProfile(id, viewerId);

  if (!profile) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}
