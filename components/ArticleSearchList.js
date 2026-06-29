"use client";
// 客户端组件：搜索框需要响应用户输入，必须在浏览器端运行

// ============================================================
// 文件作用：首页文章搜索 + 列表展示
// 功能对应：首页顶部的搜索框，按标题关键词过滤文章
// 搜索触发方式：输入关键词后按回车键才执行检索
// 搜索关键词保存在 URL 参数 ?q=xxx 中，点击 Logo 回到 / 时会自动清除搜索
// 如果搜索不生效 / 回首页没反应，检查这个文件
// ============================================================

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import PostCard from "@/components/PostCard";
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
    if (trimmed) {
      router.push(`/?q=${encodeURIComponent(trimmed)}`);
    } else {
      // 关键词为空时回到纯首页 /
      router.push("/");
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  const filteredArticles = useMemo(() => {
    if (!searchKeyword) return articles;
    const lowerKeyword = searchKeyword.toLowerCase();
    return articles.filter((article) =>
      article.title.toLowerCase().includes(lowerKeyword)
    );
  }, [searchKeyword, articles]);

  const isSearching = searchKeyword.length > 0;

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
        {isSearching && (
          <p className="article-search-result-hint">
            找到 {filteredArticles.length} 篇相关文章
          </p>
        )}
      </div>

      {filteredArticles.length > 0 ? (
        <div className="article-list">
          {filteredArticles.map((article) => (
            <PostCard key={article.id} article={article} />
          ))}
        </div>
      ) : isSearching ? (
        <div className="article-search-no-result">
          没有找到标题包含「{searchKeyword}」的文章
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
