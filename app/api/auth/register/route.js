// ============================================================
// 文件作用：用户注册 API
// 访问地址：POST /api/auth/register
// 功能对应：登录页「立即注册」表单提交（含可选头像 base64）
// 维护指引：
//   - 用户名/邮箱占用 → 本文件校验 + lib/users.js
//   - 头像保存失败 → lib/avatar.js
//   - 注册后应回到登录页（不自动登录）→ 本文件不调用 setSessionCookie
//   - 前端表单 → components/AuthForm.js（view === "register"）
// ============================================================

import { NextResponse } from "next/server";
import {
  createUser,
  getUserByEmail,
  getUserByUsername,
} from "@/lib/users";
import { saveAvatarFromBase64 } from "@/lib/avatar";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      username,
      email,
      password,
      confirmPassword,
      avatarBase64,
      avatarMimeType,
    } = body;

    if (!username || username.trim().length < 3) {
      return NextResponse.json({ error: "用户名至少 3 个字符" }, { status: 400 });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "请输入有效的邮箱地址" }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "两次输入的密码不一致" }, { status: 400 });
    }

    if (getUserByUsername(username.trim())) {
      return NextResponse.json({ error: "用户名已被占用" }, { status: 409 });
    }

    if (getUserByEmail(email.trim())) {
      return NextResponse.json({ error: "邮箱已被注册" }, { status: 409 });
    }

    let avatarUrl = "/default-avatar.svg";
    if (avatarBase64 && avatarMimeType) {
      avatarUrl = saveAvatarFromBase64(avatarBase64, avatarMimeType);
    }

    createUser({
      username: username.trim(),
      email: email.trim(),
      password,
      avatarUrl,
    });

    return NextResponse.json(
      { message: "注册成功，请登录" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "注册失败" },
      { status: 500 }
    );
  }
}
