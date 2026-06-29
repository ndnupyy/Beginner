// ============================================================
// 文件作用：返回首页链接组件（可复用）
// 功能对应：点击后跳转到首页路由 "/"
// 使用页面：写文章、编辑文章、文章详情、404 等
// 如果点击无法返回首页，检查这个文件
// ============================================================

import Link from "next/link";
import "./BackToHome.css";

/**
 * BackToHome 组件 - 返回首页
 * 点击链接跳转到 "/"（首页路由）
 */
export default function BackToHome() {
  return (
    // Link 组件：Next.js 的路由跳转，不会整页刷新
    // href="/" 表示跳转到首页
    <Link href="/" className="back-to-home">
      ← 返回首页
    </Link>
  );
}
