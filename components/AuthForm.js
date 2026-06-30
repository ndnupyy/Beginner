"use client";
// 客户端组件：需要在浏览器中响应用户输入、调用 fetch、使用 useState

// ============================================================
// 文件作用：登录 / 注册 / 找回密码 的统一表单（链接切换，无页签按钮）
// 功能对应：/login 页面的全部交互
// 维护指引：
//   - 表单 UI / 样式 → 本文件 + AuthForm.css
//   - 默认登录视图、注册/找回链接 → 本文件 switchView
//   - 登录失败 → app/api/auth/login/route.js
//   - 注册 → app/api/auth/register/route.js（成功后回登录视图）
//   - 忘记密码 → app/api/auth/forgot-password/route.js
// ============================================================

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "./AuthForm.css";

// 三种视图：login 默认 | register 注册 | forgot 找回密码
const INITIAL_FORM = {
  login: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function AuthForm() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [view, setView] = useState("login");
  const [form, setForm] = useState(INITIAL_FORM);
  const [avatarPreview, setAvatarPreview] = useState("/default-avatar.svg");
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /** 更新单个表单字段，并清除提示信息 */
  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
    setMessage("");
  }

  /**
   * 切换视图（登录 / 注册 / 找回密码）
   * @param {string} nextView - "login" | "register" | "forgot"
   * @param {string} [successMessage] - 切换回登录时可带的提示
   */
  function switchView(nextView, successMessage = "") {
    setView(nextView);
    setForm(INITIAL_FORM);
    setError("");
    setMessage(successMessage);
    setAvatarPreview("/default-avatar.svg");
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  /** 注册页：选择头像文件并预览 */
  function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("请选择图片格式的头像");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("头像大小不能超过 2MB");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError("");
  }

  /** 将选中的头像转为 base64，供注册 API 使用 */
  async function readAvatarBase64() {
    if (!avatarFile) return { avatarBase64: null, avatarMimeType: null };

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const base64 = String(result).split(",")[1];
        resolve({ avatarBase64: base64, avatarMimeType: avatarFile.type });
      };
      reader.onerror = reject;
      reader.readAsDataURL(avatarFile);
    });
  }

  /** 表单提交：根据当前视图调用不同 API */
  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (view === "login") {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            login: form.login,
            password: form.password,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "登录失败");
        router.push("/");
        router.refresh();
        return;
      }

      if (view === "register") {
        const avatarData = await readAvatarBase64();
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: form.username,
            email: form.email,
            password: form.password,
            confirmPassword: form.confirmPassword,
            ...avatarData,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "注册失败");
        switchView("login", data.message || "注册成功，请登录");
        return;
      }

      if (view === "forgot") {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: form.username,
            password: form.password,
            confirmPassword: form.confirmPassword,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "找回密码失败");
        }
        switchView("login", data.message || "密码已重置，请登录");
      }
    } catch (err) {
      setError(err.message || "操作失败");
    } finally {
      setLoading(false);
    }
  }

  /** 根据当前视图显示标题 */
  function getTitle() {
    if (view === "register") return "注册账号";
    if (view === "forgot") return "找回密码";
    return "登录";
  }

  /** 根据当前视图显示副标题 */
  function getSubtitle() {
    if (view === "register") return "填写信息完成注册";
    if (view === "forgot") return "输入注册用户名，验证通过后可设置新密码";
    return "登录后即可访问博客内容";
  }

  /** 提交按钮文字 */
  function getSubmitLabel() {
    if (loading) return "处理中...";
    if (view === "register") return "注册";
    if (view === "forgot") return "确认重置";
    return "登录";
  }

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <h1 className="auth-title">{getTitle()}</h1>
        <p className="auth-subtitle">{getSubtitle()}</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {view === "register" && (
          <div className="auth-avatar-upload">
            <img src={avatarPreview} alt="头像预览" className="auth-avatar-preview" />
            <div>
              <button
                type="button"
                className="auth-avatar-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                上传头像
              </button>
              <p className="auth-field-hint">支持 JPG / PNG / WebP / GIF，最大 2MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                onChange={handleAvatarChange}
              />
            </div>
          </div>
        )}

        {view === "login" && (
          <label className="auth-field">
            <span>用户名 / 邮箱</span>
            <input
              type="text"
              value={form.login}
              onChange={(e) => updateField("login", e.target.value)}
              placeholder="请输入用户名或邮箱"
              required
            />
          </label>
        )}

        {view === "forgot" && (
          <label className="auth-field">
            <span>用户名</span>
            <input
              type="text"
              value={form.username}
              onChange={(e) => updateField("username", e.target.value)}
              placeholder="请输入注册时的用户名"
              required
            />
          </label>
        )}

        {view === "register" && (
          <>
            <label className="auth-field">
              <span>用户名</span>
              <input
                type="text"
                value={form.username}
                onChange={(e) => updateField("username", e.target.value)}
                placeholder="至少 3 个字符"
                required
              />
            </label>
            <label className="auth-field">
              <span>邮箱</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="name@example.com"
                required
              />
            </label>
          </>
        )}

        {(view === "login" || view === "register" || view === "forgot") && (
          <>
            <label className="auth-field">
              <span>{view === "forgot" ? "新密码" : "密码"}</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="至少 6 位"
                required
              />
              {view === "login" && (
                <button
                  type="button"
                  className="auth-link auth-forgot-link"
                  onClick={() => switchView("forgot")}
                >
                  忘记密码？
                </button>
              )}
            </label>

            {(view === "register" || view === "forgot") && (
              <label className="auth-field">
                <span>确认密码</span>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  placeholder="再次输入密码"
                  required
                />
              </label>
            )}
          </>
        )}

        {error && <p className="auth-message auth-message-error">{error}</p>}
        {message && <p className="auth-message auth-message-success">{message}</p>}

        <button type="submit" className="auth-submit" disabled={loading}>
          {getSubmitLabel()}
        </button>

        {view !== "login" && (
          <p className="auth-switch-row">
            已有账号？
            <button
              type="button"
              className="auth-link"
              onClick={() => switchView("login")}
            >
              返回登录
            </button>
          </p>
        )}

        {view === "login" && (
          <p className="auth-switch-row">
            还没有账号？
            <button
              type="button"
              className="auth-link"
              onClick={() => switchView("register")}
            >
              立即注册
            </button>
          </p>
        )}
      </form>
    </div>
  );
}
