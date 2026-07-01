// ============================================================
// 文件作用：上传 / 清除当前用户主页背景图 API
// 访问地址：
//   POST /api/auth/upload-profile-background
//   DELETE /api/auth/upload-profile-background
// 维护指引：
//   - 文件保存 → lib/profileBackground.js
//   - 数据库 → lib/users.js updateUserProfileBackground
// ============================================================

import { NextResponse } from "next/server";
import {
  deleteProfileBackgroundFile,
  saveProfileBackgroundFromFormData,
} from "@/lib/profileBackground";
import { getSessionUserId } from "@/lib/session";
import { getUserById, updateUserProfileBackground } from "@/lib/users";

export async function POST(request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const existingUser = await getUserById(userId);
    if (!existingUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("background");

    const profileBackgroundUrl = await saveProfileBackgroundFromFormData(file);

    if (existingUser.profileBackgroundUrl) {
      deleteProfileBackgroundFile(existingUser.profileBackgroundUrl);
    }

    const user = await updateUserProfileBackground(userId, profileBackgroundUrl);

    return NextResponse.json({
      user,
      profileBackgroundUrl: user.profileBackgroundUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "背景图上传失败" },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const existingUser = await getUserById(userId);
    if (!existingUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if (existingUser.profileBackgroundUrl) {
      deleteProfileBackgroundFile(existingUser.profileBackgroundUrl);
    }

    const user = await updateUserProfileBackground(userId, "");

    return NextResponse.json({
      user,
      profileBackgroundUrl: "",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "背景图清除失败" },
      { status: 400 }
    );
  }
}
