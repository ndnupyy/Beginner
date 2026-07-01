"use client";
// ============================================================
// 文件作用：顶栏居中搜索框（历史 + 猜你想搜）
// 功能对应：components/Header.js 中间搜索区域
// 维护指引：
//   - 搜索历史 → lib/searchHistory.js
//   - 推荐词 → lib/searchDiscovery.js
//   - 首页筛选结果 → components/ArticleSearchList.js
// ============================================================

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildHomeUrl } from "@/lib/homeUrl";
import {
  addSearchHistory,
  clearSearchHistory,
  getSearchHistory,
} from "@/lib/searchHistory";
import { getSearchDiscoverySuggestions } from "@/lib/searchDiscovery";
import "./HeaderSearchBar.css";

function HeaderSearchBarInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchKeyword = (searchParams.get("q") || "").trim();
  const [inputValue, setInputValue] = useState(
    pathname === "/" ? searchKeyword : ""
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [discoveryItems, setDiscoveryItems] = useState([]);
  const searchAreaRef = useRef(null);
  const articlesCacheRef = useRef([]);

  useEffect(() => {
    if (pathname === "/") {
      setInputValue(searchParams.get("q") || "");
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchAreaRef.current &&
        !searchAreaRef.current.contains(event.target)
      ) {
        setPanelOpen(false);
      }
    }

    if (panelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [panelOpen]);

  /**
   * 拉取文章列表供「猜你想搜」使用
   * @returns {Promise<object[]>}
   */
  async function loadArticles() {
    if (articlesCacheRef.current.length > 0) {
      return articlesCacheRef.current;
    }

    try {
      const response = await fetch("/api/articles");
      if (!response.ok) return [];
      const data = await response.json();
      articlesCacheRef.current = Array.isArray(data) ? data : [];
      return articlesCacheRef.current;
    } catch {
      return [];
    }
  }

  /**
   * 拉取登录用户浏览历史
   * @returns {Promise<object[]>}
   */
  async function loadBrowsedArticles() {
    try {
      const response = await fetch("/api/history");
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data.articles) ? data.articles : [];
    } catch {
      return [];
    }
  }

  /**
   * 计算推荐词
   * @param {string[]} history
   * @param {object[]} browsedArticles
   * @param {object[]} articles
   */
  function refreshDiscovery(history, browsedArticles, articles) {
    setDiscoveryItems(
      getSearchDiscoverySuggestions({
        articles,
        searchHistory: history,
        browsedArticles,
      })
    );
  }

  /**
   * 打开搜索下拉面板
   */
  async function openSearchPanel() {
    const history = getSearchHistory();
    setHistoryItems(history);

    const [browsedArticles, articles] = await Promise.all([
      loadBrowsedArticles(),
      loadArticles(),
    ]);
    refreshDiscovery(history, browsedArticles, articles);
    setPanelOpen(true);
  }

  /**
   * 执行搜索并跳转首页
   * @param {string} keyword
   */
  function performSearch(keyword) {
    const trimmed = (keyword || "").trim();
    setInputValue(trimmed);
    setPanelOpen(false);

    if (trimmed) {
      const nextHistory = addSearchHistory(trimmed);
      setHistoryItems(nextHistory);
      refreshDiscovery(
        nextHistory,
        [],
        articlesCacheRef.current
      );
    }

    const params = pathname === "/" ? searchParams : new URLSearchParams();
    router.push(buildHomeUrl(params, { q: trimmed }));
  }

  function handleSearch() {
    performSearch(inputValue);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  }

  function handleClearHistory() {
    const cleared = clearSearchHistory();
    setHistoryItems(cleared);
    refreshDiscovery(cleared, [], articlesCacheRef.current);
  }

  return (
    <div className="header-search" ref={searchAreaRef}>
      <div className="header-search-control">
        <div className="header-search-input-wrap">
          <span className="header-search-hot-icon" aria-hidden="true">
            🔥
          </span>
          <span className="header-search-divider" aria-hidden="true" />
          <input
            type="text"
            className="header-search-input"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onFocus={openSearchPanel}
            onClick={openSearchPanel}
            onKeyDown={handleKeyDown}
            placeholder="搜索文章标题..."
            aria-expanded={panelOpen}
            aria-haspopup="listbox"
          />
        </div>
        <button
          type="button"
          className="header-search-submit"
          onClick={handleSearch}
        >
          <span className="header-search-submit-icon" aria-hidden="true">
            🔍
          </span>
          搜索
        </button>
      </div>

      {panelOpen && (
        <div className="header-search-dropdown">
          <div className="header-search-dropdown-column">
            <div className="header-search-panel-header">
              <span className="header-search-panel-title">搜索历史</span>
              {historyItems.length > 0 && (
                <button
                  type="button"
                  className="header-search-panel-clear"
                  onClick={handleClearHistory}
                >
                  <span aria-hidden="true">🗑</span>
                  清空
                </button>
              )}
            </div>

            {historyItems.length > 0 ? (
              <ul className="header-search-panel-list" role="listbox">
                {historyItems.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      className="header-search-panel-item"
                      role="option"
                      onClick={() => performSearch(item)}
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="header-search-panel-empty">暂无搜索历史</p>
            )}
          </div>

          <div className="header-search-dropdown-divider" aria-hidden="true" />

          <div className="header-search-dropdown-column">
            <div className="header-search-panel-header">
              <span className="header-search-panel-title">猜你想搜</span>
            </div>

            {discoveryItems.length > 0 ? (
              <ul className="header-search-panel-list" role="listbox">
                {discoveryItems.map((item) => (
                  <li key={item.keyword}>
                    <button
                      type="button"
                      className="header-search-panel-item header-search-panel-item-discovery"
                      role="option"
                      onClick={() => performSearch(item.keyword)}
                    >
                      <span className="header-search-panel-item-text">
                        {item.keyword}
                      </span>
                      {item.hot && (
                        <span className="header-search-panel-hot" aria-label="热门">
                          🔥
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="header-search-panel-empty">暂无推荐词</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HeaderSearchBar() {
  return (
    <Suspense fallback={<div className="header-search header-search--fallback" />}>
      <HeaderSearchBarInner />
    </Suspense>
  );
}
