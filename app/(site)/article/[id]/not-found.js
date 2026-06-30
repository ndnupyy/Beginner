// ============================================================
// 文件作用：404 页面（文章不存在时显示）
// 功能对应：访问不存在的文章 ID 时的提示页面
// ============================================================

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-container">
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <p className="empty-state-text">抱歉，找不到这篇文章</p>
        <Link href="/" className="empty-state-link">
          返回首页
        </Link>
      </div>
    </div>
  );
}
