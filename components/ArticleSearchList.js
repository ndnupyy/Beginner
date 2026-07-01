"use client";
// 客户端组件：搜索框需要响应用户输入，必须在浏览器端运行

// ============================================================
// 文件作用：首页文章列表展示（分类筛选 + 搜索结果）
// 功能对应：首页分类专栏 + 文章列表 + 分页
// 搜索框 → components/HeaderSearchBar.js（顶栏居中）
// 筛选参数：?category=专栏名  ?q=关键词  ?page=页码（可组合，每页 10 篇）
// ============================================================

import { useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import CategoryNav from "@/components/CategoryNav";
import ArticlePagination, { PAGE_SIZE } from "@/components/ArticlePagination";
import "./ArticleSearchList.css";

/**
 * ArticleSearchListInner - 列表内部组件
 * 必须单独拆出来，因为 useSearchParams 需要被 Suspense 包裹
 */
function ArticleSearchListInner({ articles }) {
  const searchParams = useSearchParams();

  const searchKeyword = (searchParams.get("q") || "").trim();
  const categoryFilter = (searchParams.get("category") || "").trim();
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const requestedPage = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  const filteredArticles = useMemo(() => {
    let result = articles;

    if (categoryFilter) {
      result = result.filter((article) => article.category === categoryFilter);
    }

    if (searchKeyword) {
      const lowerKeyword = searchKeyword.toLowerCase();
      result = result.filter((article) =>
        article.title.toLowerCase().includes(lowerKeyword)
      );
    }

    return result;
  }, [searchKeyword, categoryFilter, articles]);

  const totalCount = filteredArticles.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const isSearching = searchKeyword.length > 0;
  const isCategoryFiltered = categoryFilter.length > 0;
  const showPagination = totalPages > 1;

  if (articles.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📝</div>
        <p className="empty-state-text">还没有文章，快来写第一篇吧！</p>
        <Link href="/write" className="empty-state-link">
          去写文章
        </Link>
      </div>
    );
  }

  return (
    <>
      <CategoryNav articles={articles} />

      {(isSearching || isCategoryFiltered || showPagination) && totalCount > 0 && (
        <p className="article-search-result-hint">
          {isCategoryFiltered && isSearching
            ? `「${categoryFilter}」专栏下找到 ${totalCount} 篇相关文章`
            : isCategoryFiltered
            ? `「${categoryFilter}」专栏共 ${totalCount} 篇文章`
            : isSearching
            ? `找到 ${totalCount} 篇相关文章`
            : `共 ${totalCount} 篇文章`}
          {showPagination &&
            `，第 ${currentPage}/${totalPages} 页，每页 ${PAGE_SIZE} 篇`}
        </p>
      )}

      {paginatedArticles.length > 0 ? (
        <>
          <div className="article-list">
            {paginatedArticles.map((article) => (
              <PostCard key={article.id} article={article} />
            ))}
          </div>
          <ArticlePagination
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </>
      ) : isSearching || isCategoryFiltered ? (
        <div className="article-search-no-result">
          {isCategoryFiltered && isSearching
            ? `「${categoryFilter}」专栏下没有找到标题包含「${searchKeyword}」的文章`
            : isCategoryFiltered
            ? `「${categoryFilter}」专栏下还没有文章`
            : `没有找到标题包含「${searchKeyword}」的文章`}
        </div>
      ) : null}
    </>
  );
}

/**
 * ArticleSearchList - 带 Suspense 包裹的导出组件
 */
export default function ArticleSearchList({ articles }) {
  return (
    <Suspense
      fallback={
        <div className="article-search-no-result">加载中...</div>
      }
    >
      <ArticleSearchListInner articles={articles} />
    </Suspense>
  );
}
