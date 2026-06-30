// ============================================================
// 文件作用：用户登录 API
// 访问地址：POST /api/auth/login
// 功能对应：登录页「登录」按钮提交
// 维护指引：
//   - 账号密码错误 → 本文件 + lib/users.js + lib/password.js
//   - 登录成功但无 Cookie → lib/session.js setSessionCookie
//   - 表单提交逻辑 → components/AuthForm.js
// ============================================================

import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/password";
import { getUserByLogin } from "@/lib/users";
import { setSessionCookie } from "@/lib/session";

export async function POST(request) {
  try {
    const body = await request.json();
    const { login, password } = body;

    if (!login || !password) {
      return NextResponse.json({ error: "请输入账号和密码" }, { status: 400 });
    }

    const user = getUserByLogin(login.trim());
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
    }

    await setSessionCookie(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatar_url,
      },
    });
  } catch {
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
