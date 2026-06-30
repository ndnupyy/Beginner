"use client";
// ============================================================
// 文件作用：文章阅读量统计（每会话每篇文章只计一次）
// 功能对应：文章详情页
// ============================================================

import { useEffect } from "react";

export default function ArticleViewTracker({ articleId }) {
  useEffect(() => {
    if (!articleId) return;

    const key = `article-view:${articleId}`;
    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, "1");

    fetch(`/api/articles/${articleId}/view`, { method: "POST" }).catch(() => {
      sessionStorage.removeItem(key);
    });
  }, [articleId]);

  return null;
}
