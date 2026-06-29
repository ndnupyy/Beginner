"use client";
// 客户端组件：需要在首页时强制清除 URL 中的搜索参数

// ============================================================
// 文件作用：顶部导航栏组件
// 功能对应：Logo（点击回首页）+ 写文章按钮
// 在首页点击 Logo 时，会清除 ?q= 搜索参数，恢复显示全部文章
// ============================================================

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "./Header.css";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  /**
   * 点击 Logo 时的处理
   * 如果当前已在首页（可能有 ?q= 搜索参数），强制跳转到纯 / 以清除搜索
   */
  function handleGoHome(e) {
    if (pathname === "/") {
      e.preventDefault();
      router.push("/");
    }
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="header-logo" onClick={handleGoHome}>
          简易博客
        </Link>

        <Link href="/write" className="header-write-btn">
          写文章
        </Link>
      </div>
    </header>
  );
}
