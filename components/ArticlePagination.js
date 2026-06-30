"use client";
// ============================================================
// 文件作用：首页文章列表分页控件
// 功能对应：每页 10 篇，通过 URL 参数 ?page= 切换页码
// 维护指引：样式 → ArticlePagination.css；页大小 → PAGE_SIZE
// ============================================================

import { useRouter, useSearchParams } from "next/navigation";
import { buildHomeUrl } from "@/lib/homeUrl";
import "./ArticlePagination.css";

export const PAGE_SIZE = 10;

export default function ArticlePagination({ currentPage, totalPages }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function goToPage(page) {
    router.push(buildHomeUrl(searchParams, { page }));
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="article-pagination" aria-label="文章分页">
      <button
        type="button"
        className="article-pagination-btn"
        disabled={currentPage <= 1}
        onClick={() => goToPage(currentPage - 1)}
      >
        上一页
      </button>

      <div className="article-pagination-pages">
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            className={`article-pagination-page${
              page === currentPage ? " article-pagination-page-active" : ""
            }`}
            onClick={() => goToPage(page)}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="article-pagination-btn"
        disabled={currentPage >= totalPages}
        onClick={() => goToPage(currentPage + 1)}
      >
        下一页
      </button>
    </nav>
  );
}
