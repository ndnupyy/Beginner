// ============================================================
// 文件作用：更换当前登录用户头像 API
// 访问地址：POST /api/auth/upload-avatar
// 功能对应：导航栏头像下拉「更换头像」
// 维护指引：
//   - 上传失败 / 格式不对 → lib/avatar.js
//   - 数据库未更新 → lib/users.js updateUserAvatar
//   - 下拉菜单交互 → components/Header.js
// ============================================================

import { NextResponse } from "next/server";
import { saveAvatarFromFormData } from "@/lib/avatar";
import { getSessionUserId } from "@/lib/session";
import { getUserById, updateUserAvatar } from "@/lib/users";

export async function POST(request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const existingUser = getUserById(userId);
    if (!existingUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar");

    const avatarUrl = await saveAvatarFromFormData(file);
    const user = updateUserAvatar(userId, avatarUrl);

    return NextResponse.json({ user, avatarUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "头像上传失败" },
      { status: 400 }
    );
  }
}
