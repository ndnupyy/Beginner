// ============================================================
// 文件作用：首页标题栏右侧的「排行榜」入口
// 功能对应：跳转至 /ranking 阅读排行榜页
// 维护指引：样式 → RankingLink.css
// ============================================================

import Link from "next/link";
import "./RankingLink.css";

export default function RankingLink() {
  return (
    <Link href="/ranking" className="ranking-link">
      <svg
        className="ranking-link-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" />
        <path d="M6 7H4a2 2 0 0 0-2 2v1h20V9a2 2 0 0 0-2-2h-2" />
        <path d="M12 11v3" />
        <path d="M8 21h8" />
        <path d="M9 14h6v4H9v-4Z" />
      </svg>
      排行榜
    </Link>
  );
}
