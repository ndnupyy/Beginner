"use client";
// ============================================================
// 文件作用：收藏夹文章列表分页控件
// 功能对应：/favorites 页收藏夹内文章，每页 15 条
// 维护指引：样式复用 ArticlePagination.css；页大小 → FAVORITES_PAGE_SIZE
// ============================================================

import "./ArticlePagination.css";

export const FAVORITES_PAGE_SIZE = 15;

/**
 * FavoritesPagination - 收藏夹分页
 * @param {Object} props
 * @param {number} props.currentPage - 当前页码（从 1 开始）
 * @param {number} props.totalPages - 总页数
 * @param {number} props.totalCount - 当前筛选结果总数
 * @param {(page: number) => void} props.onPageChange - 切换页码
 */
export default function FavoritesPagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="article-pagination" aria-label="收藏文章分页">
      <p className="article-pagination-summary">
        共 {totalCount} 篇，第 {currentPage}/{totalPages} 页，每页 {FAVORITES_PAGE_SIZE} 篇
      </p>

      <button
        type="button"
        className="article-pagination-btn"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
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
            onClick={() => onPageChange(page)}
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
        onClick={() => onPageChange(currentPage + 1)}
      >
        下一页
      </button>
    </nav>
  );
}
