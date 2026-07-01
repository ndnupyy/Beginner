"use client";
// ============================================================
// 文件作用：将作者主页背景应用到右侧内容滚动区
// 功能对应：/user/[id]、/article/[id] 页面底色
// 维护指引：背景样式 → app/globals.css .site-main-body--custom-bg
// ============================================================

import { useEffect } from "react";

/**
 * PageBackground - 为站点主内容区设置作者自定义背景
 * @param {Object} props
 * @param {string} [props.url] - 背景图 URL，空则保持默认
 */
export default function PageBackground({ url = "" }) {
  useEffect(() => {
    const mainBody = document.querySelector(".site-main-body");
    if (!mainBody) return;

    const trimmedUrl = (url || "").trim();
    if (!trimmedUrl) return;

    mainBody.classList.add("site-main-body--custom-bg");
    mainBody.style.setProperty("--author-page-bg", `url("${trimmedUrl}")`);

    return () => {
      mainBody.classList.remove("site-main-body--custom-bg");
      mainBody.style.removeProperty("--author-page-bg");
    };
  }, [url]);

  return null;
}
