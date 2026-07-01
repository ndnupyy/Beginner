"use client";
// 客户端组件：需要 fetch 当前用户、头像下拉菜单、更换头像、退出登录

// ============================================================
// 文件作用：顶部导航栏（Logo、居中搜索、用户头像下拉、发布文章）
// 功能对应：登录后各博客页面的顶部栏
// 维护指引：
//   - 样式 / 下拉框 → Header.css
//   - 用户信息不显示 → app/api/auth/me/route.js
//   - 更换头像失败 → app/api/auth/upload-avatar/route.js
//   - 退出无效 → app/api/auth/logout/route.js
//   - 头像下拉「个人主页」→ /user/[id]
//   - 头像下拉「私信」→ /messages
//   - 私信未读角标 → GET /api/chat/unread
// ============================================================

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CHAT_UNREAD_EVENT } from "@/lib/chatEvents";
import HeaderSearchBar from "@/components/HeaderSearchBar";
import "./Header.css";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  async function loadUnreadCount() {
    try {
      const response = await fetch("/api/chat/unread");
      if (!response.ok) {
        setUnreadCount(0);
        return;
      }
      const data = await response.json();
      setUnreadCount(data.totalUnread || 0);
    } catch {
      setUnreadCount(0);
    }
  }

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          loadUnreadCount();
        } else {
          setUser(null);
          setUnreadCount(0);
        }
      } catch {
        setUser(null);
        setUnreadCount(0);
      }
    }

    loadUser();
  }, [pathname]);

  useEffect(() => {
    if (!user) return undefined;

    function handleUnreadUpdate() {
      loadUnreadCount();
    }

    window.addEventListener(CHAT_UNREAD_EVENT, handleUnreadUpdate);
    const timer = window.setInterval(loadUnreadCount, 30000);

    return () => {
      window.removeEventListener(CHAT_UNREAD_EVENT, handleUnreadUpdate);
      window.clearInterval(timer);
    };
  }, [user]);

  // 点击页面其他区域时关闭下拉框
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  function handleGoHome(e) {
    if (pathname === "/") {
      e.preventDefault();
      router.push("/");
    }
  }

  function toggleMenu() {
    setMenuOpen((open) => !open);
  }

  function handleChangeAvatarClick() {
    setMenuOpen(false);
    fileInputRef.current?.click();
  }

  async function handleAvatarFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("请选择图片格式的头像");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("头像大小不能超过 2MB");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/auth/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "头像更换失败");
      }

      setUser(data.user);
      router.refresh();
    } catch (error) {
      alert(error.message || "头像更换失败");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleLogout() {
    setMenuOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="header-logo" onClick={handleGoHome}>
          简易博客
        </Link>

        <HeaderSearchBar />

        <div className="header-actions">
          {user && (
            <div className="header-user-menu" ref={menuRef}>
              <button
                type="button"
                className="header-user-trigger"
                onClick={toggleMenu}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                disabled={uploading}
              >
                <img
                  src={user.avatarUrl || "/default-avatar.svg"}
                  alt={user.username}
                  className="header-user-avatar"
                />
                <span className="header-user-name">{user.username}</span>
                {unreadCount > 0 ? (
                  <span className="header-user-unread-dot" aria-label={`${unreadCount} 条未读私信`} />
                ) : null}
                <span className="header-user-arrow">{menuOpen ? "▲" : "▼"}</span>
              </button>

              {menuOpen && (
                <div className="header-dropdown">
                  <Link
                    href={`/user/${user.id}`}
                    className="header-dropdown-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    个人主页
                  </Link>
                  <Link
                    href="/messages"
                    className="header-dropdown-item header-dropdown-item-with-badge"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>私信</span>
                    {unreadCount > 0 ? (
                      <span className="header-unread-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : null}
                  </Link>
                  <button
                    type="button"
                    className="header-dropdown-item"
                    onClick={handleChangeAvatarClick}
                  >
                    更换头像
                  </button>
                  <button
                    type="button"
                    className="header-dropdown-item header-dropdown-item-danger"
                    onClick={handleLogout}
                  >
                    退出登录
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                onChange={handleAvatarFileChange}
              />
            </div>
          )}

          <Link href="/write" className="header-write-btn">
            发布文章
          </Link>
        </div>
      </div>
    </header>
  );
}
