"use client";
// ============================================================
// 文件作用：带过渡动画的文章详情链接
// 功能对应：首页卡片、轮播图等跳转 /article/[id]
// 维护指引：
//   - 动画参数 → lib/articlePageTransition.js
//   - 入场动画 → components/SiteShell.css
// ============================================================

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ARTICLE_LEAVE_MS,
  endArticleLeaveTransition,
  shouldAnimateArticleNavigation,
  startArticleLeaveTransition,
} from "@/lib/articlePageTransition";

/**
 * @param {import('next/link').LinkProps & { className?: string, children?: React.ReactNode }} props
 */
export default function ArticleLink({ href, onClick, children, ...rest }) {
  const router = useRouter();

  /**
   * 点击后先播放离场动画，再执行路由跳转
   * @param {React.MouseEvent<HTMLAnchorElement>} event
   */
  function handleClick(event) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (!shouldAnimateArticleNavigation(event)) return;

    const target = typeof href === "string" ? href : href?.pathname || "";
    if (!target.startsWith("/article/")) return;

    event.preventDefault();
    startArticleLeaveTransition();

    window.setTimeout(() => {
      router.push(target);
      window.setTimeout(endArticleLeaveTransition, 80);
    }, ARTICLE_LEAVE_MS);
  }

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
