"use client";
// ============================================================
// 文件作用：浏览历史列表（顶栏搜索 + 标签筛选 + 分页）
// 功能对应：/history 页
// 维护指引：
//   - 样式 → HistoryList.css
//   - 分页 → components/FavoritesPagination.js
//   - 顶栏隐藏 → components/SiteShell.js
// ============================================================

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import FavoritesPagination, {
  FAVORITES_PAGE_SIZE,
} from "@/components/FavoritesPagination";
import {
  articleHasTag,
  collectUniqueTagsFromArticles,
  isSameTag,
} from "@/lib/tags";
import "./HistoryList.css";

/**
 * HistoryList - 浏览历史文章列表
 * @param {Object} props
 * @param {Array} props.articles - 服务端预取的浏览历史文章
 */
export default function HistoryList({ articles: initialArticles = [] }) {
  const [articles] = useState(initialArticles);
  const [inputValue, setInputValue] = useState("");
  const [idKeyword, setIdKeyword] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const availableTags = useMemo(
    () => collectUniqueTagsFromArticles(articles),
    [articles]
  );

  const filteredArticles = useMemo(() => {
    let result = articles;

    if (activeTag) {
      result = result.filter((article) =>
        articleHasTag(article.tags, activeTag)
      );
    }

    if (idKeyword) {
      const lowerKeyword = idKeyword.toLowerCase();
      result = result.filter((article) =>
        String(article.id).toLowerCase().includes(lowerKeyword)
      );
    }

    return result;
  }, [articles, activeTag, idKeyword]);

  const totalCount = filteredArticles.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / FAVORITES_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedArticles = useMemo(() => {
    const start = (safeCurrentPage - 1) * FAVORITES_PAGE_SIZE;
    return filteredArticles.slice(start, start + FAVORITES_PAGE_SIZE);
  }, [filteredArticles, safeCurrentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTag, idKeyword]);

  function handleSearch() {
    setIdKeyword(inputValue.trim());
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      handleSearch();
    }
  }

  const isSearching = idKeyword.length > 0;
  const isTagFiltered = activeTag.length > 0;
  const showHint = isSearching || isTagFiltered || totalPages > 1;

  if (articles.length === 0) {
    return (
      <div className="history-page">
        <header className="history-page-header">
          <h1 className="history-page-title">历史</h1>
        </header>
        <div className="history-page-body">
          <div className="empty-state">
            <div className="empty-state-icon">🕘</div>
            <p className="empty-state-text">还没有浏览记录</p>
            <Link href="/" className="empty-state-link">
              去首页看看
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <header className="history-page-header">
        <h1 className="history-page-title">历史</h1>
        <div className="history-search">
          <div className="history-search-control">
            <div className="history-search-input-wrap">
              <span className="history-search-icon" aria-hidden="true">
                🔍
              </span>
              <input
                type="text"
                className="history-search-input"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索历史记录（文章 ID）"
                aria-label="搜索历史记录"
              />
            </div>
            <button
              type="button"
              className="history-search-submit"
              onClick={handleSearch}
            >
              <span className="history-search-submit-icon" aria-hidden="true">
                🔍
              </span>
              搜索
            </button>
          </div>
          {showHint && totalCount > 0 && (
            <p className="history-search-hint">
              {isTagFiltered && isSearching
                ? `标签「${activeTag}」下找到 ID 含「${idKeyword}」的 ${totalCount} 篇`
                : isTagFiltered
                ? `标签「${activeTag}」共 ${totalCount} 篇`
                : isSearching
                ? `找到 ID 含「${idKeyword}」的 ${totalCount} 篇`
                : `共 ${totalCount} 篇浏览记录`}
              {totalPages > 1 &&
                `，第 ${safeCurrentPage}/${totalPages} 页，每页 ${FAVORITES_PAGE_SIZE} 篇`}
            </p>
          )}
        </div>
      </header>

      <div className="history-page-body">
        {availableTags.length > 0 && (
          <div className="history-tag-nav" aria-label="标签筛选">
            <div className="history-tag-nav-scroll">
              <button
                type="button"
                className={`history-tag-nav-item${
                  !activeTag ? " history-tag-nav-item-active" : ""
                }`}
                onClick={() => setActiveTag("")}
              >
                全部
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`history-tag-nav-item${
                    isSameTag(activeTag, tag) ? " history-tag-nav-item-active" : ""
                  }`}
                  onClick={() => setActiveTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {paginatedArticles.length > 0 ? (
          <>
            <div className="article-list">
              {paginatedArticles.map((article) => (
                <PostCard key={article.id} article={article} />
              ))}
            </div>
            <FavoritesPagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <div className="history-no-result">
            {isSearching || isTagFiltered ? (
              <>
                <p>没有符合条件的浏览记录</p>
                <button
                  type="button"
                  className="history-no-result-reset"
                  onClick={() => {
                    setActiveTag("");
                    setIdKeyword("");
                    setInputValue("");
                  }}
                >
                  清除筛选
                </button>
              </>
            ) : (
              <p>暂无数据</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
