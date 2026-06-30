// ============================================================
// 文件作用：登录页路由
// 访问地址：/login
// 功能对应：登录、注册、找回密码、重置密码的统一入口
// 维护指引：
//   - 页面布局/样式 → login.css + components/AuthForm.css
//   - 表单交互与 API 调用 → components/AuthForm.js
//   - 未登录跳转逻辑 → middleware.js
// ============================================================

import AuthForm from "@/components/AuthForm";
import "./login.css";

export const metadata = {
  title: "登录 - 简易博客",
  description: "登录、注册或找回密码",
};

export default function LoginPage() {
  return (
    <div className="auth-page">
      <AuthForm />
    </div>
  );
}
