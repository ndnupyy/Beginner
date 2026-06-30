"use client";
// ============================================================
// 文件作用：文章阅读量统计 + 浏览历史记录
// 功能对应：文章详情页
// 维护指引：
//   - 阅读量 → POST /api/articles/[id]/view（每会话每篇一次）
//   - 浏览历史 → POST /api/history（每次进入详情页）
// ============================================================

import { useEffect } from "react";

export default function ArticleViewTracker({ articleId }) {
  useEffect(() => {
    if (!articleId) return;

    fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId }),
    }).catch(() => {});

    const key = `article-view:${articleId}`;
    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, "1");

    fetch(`/api/articles/${articleId}/view`, { method: "POST" }).catch(() => {
      sessionStorage.removeItem(key);
    });
  }, [articleId]);

  return null;
}
