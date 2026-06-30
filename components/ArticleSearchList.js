"use client";
// 客户端组件：搜索框需要响应用户输入，必须在浏览器端运行

// ============================================================
// 文件作用：首页文章搜索 + 列表展示
// 功能对应：首页顶部的分类专栏 + 搜索框，按专栏 / 标题关键词过滤文章
// 筛选参数：?category=专栏名  ?q=关键词  ?page=页码（可组合，每页 10 篇）
// 如果搜索不生效 / 回首页没反应，检查这个文件
// ============================================================

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { buildHomeUrl } from "@/lib/homeUrl";
import PostCard from "@/components/PostCard";
import CategoryNav from "@/components/CategoryNav";
import ArticlePagination, { PAGE_SIZE } from "@/components/ArticlePagination";
import "./ArticleSearchList.css";

/**
 * ArticleSearchListInner - 搜索列表内部组件
 * 必须单独拆出来，因为 useSearchParams 需要被 Suspense 包裹
 */
function ArticleSearchListInner({ articles }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 从 URL 参数 ?q=xxx 读取当前搜索关键词（点击 Logo 回到 / 时此处会变为空）
  const searchKeyword = (searchParams.get("q") || "").trim();
  const categoryFilter = (searchParams.get("category") || "").trim();
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const requestedPage = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  // 输入框里正在输入的文字
  const [inputValue, setInputValue] = useState(searchKeyword);

  // 当 URL 变化时（例如点击 Logo 从 /?q=xxx 跳回 /），同步更新输入框
  useEffect(() => {
    setInputValue(searchParams.get("q") || "");
  }, [searchParams]);

  /**
   * 按回车执行搜索：把关键词写入 URL 参数
   * 例如搜索 "Next" → 地址变为 /?q=Next
   */
  function handleSearch() {
    const trimmed = inputValue.trim();
    router.push(buildHomeUrl(searchParams, { q: trimmed }));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

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

      <div className="article-search-bar">
        <div className="article-search-input-wrap">
          <span className="article-search-icon">🔍</span>
          <input
            type="text"
            className="article-search-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索文章标题，按回车检索..."
          />
        </div>
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
      </div>

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
