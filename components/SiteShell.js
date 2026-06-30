"use client";
// ============================================================
// 文件作用：站点外壳（左侧栏 + 顶栏 + 内容区）
// 功能对应：普通页显示导航 Sidebar，文章详情页显示 AuthorSidebar
// 维护指引：
//   - 导航栏 → Sidebar.js
//   - 作者栏 → AuthorSidebar.js
//   - 私信未读监听 → ChatUnreadListener.js
// ============================================================

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import AuthorSidebar from "@/components/AuthorSidebar";
import ChatUnreadListener from "@/components/ChatUnreadListener";
import "./SiteShell.css";

export default function SiteShell({ children }) {
  const pathname = usePathname();
  const [userId, setUserId] = useState("");
  const articleMatch = pathname.match(/^\/article\/([^/]+)$/);
  const articleId = articleMatch?.[1];

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          if (!cancelled) setUserId("");
          return;
        }
        const data = await response.json();
        if (!cancelled) setUserId(data.user?.id || "");
      } catch {
        if (!cancelled) setUserId("");
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <div
      className={`site-layout${articleId ? " site-layout--article" : ""}`}
    >
      {userId ? <ChatUnreadListener userId={userId} /> : null}
      {articleId ? (
        <AuthorSidebar articleId={articleId} />
      ) : (
        <Sidebar />
      )}
      <div className="site-main">
        <Header />
        <main className="site-main-body">{children}</main>
      </div>
    </div>
  );
}
