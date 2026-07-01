"use client";
// ============================================================
// 文件作用：文章详情页作者背景（cover 铺满）
// 功能对应：/user/[id]、/article/[id] 整页背景（cover 铺满）
// 维护指引：样式 → app/globals.css .site-main-body--custom-bg
// ============================================================

import { useEffect } from "react";
import {
  applyBackgroundToElement,
  clearBackgroundFromElement,
} from "@/lib/backgroundDisplay";

/**
 * PageBackground - 为文章页主内容区设置作者背景
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
    applyBackgroundToElement(mainBody, trimmedUrl, "cover");

    return () => {
      mainBody.classList.remove("site-main-body--custom-bg");
      clearBackgroundFromElement(mainBody);
    };
  }, [url]);

  return null;
}
