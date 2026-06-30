"use client";
// ============================================================
// 文件作用：站点外壳（左侧栏 + 顶栏 + 内容区）
// 功能对应：普通页显示导航 Sidebar，文章详情页显示 AuthorSidebar
// 维护指引：
//   - 导航栏 → Sidebar.js
//   - 作者栏 → AuthorSidebar.js
// ============================================================

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import AuthorSidebar from "@/components/AuthorSidebar";
import "./SiteShell.css";

export default function SiteShell({ children }) {
  const pathname = usePathname();
  const articleMatch = pathname.match(/^\/article\/([^/]+)$/);
  const articleId = articleMatch?.[1];

  return (
    <div
      className={`site-layout${articleId ? " site-layout--article" : ""}`}
    >
      {articleId ? (
        <AuthorSidebar articleId={articleId} />
      ) : (
        <Sidebar />
      )}
      <div className="site-main">
        <Header />
        {children}
      </div>
    </div>
  );
}
