// ============================================================
// 文件作用：找回密码 API（按 SQLite 用户名检索 id 后改密）
// 访问地址：POST /api/auth/forgot-password
// 功能对应：登录页点击「忘记密码」后的表单提交
// 维护指引：
//   - 用户名不存在 / 无法改密 → lib/users.js resetPasswordByUsername
//   - users 表结构 → lib/db.js
//   - 页面报错不显示 → components/AuthForm.js catch 中的 setError
// ============================================================

import { NextResponse } from "next/server";
import { resetPasswordByUsername } from "@/lib/users";

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password, confirmPassword } = body;

    if (!username || !username.trim()) {
      return NextResponse.json({ error: "请输入用户名" }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "新密码至少 6 位" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "两次输入的密码不一致" }, { status: 400 });
    }

    const result = await resetPasswordByUsername(username, password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ message: "密码已重置，请使用新密码登录" });
  } catch {
    return NextResponse.json({ error: "找回密码失败" }, { status: 500 });
  }
}
