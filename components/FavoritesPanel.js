"use client";
// ============================================================
// 文件作用：收藏页主界面（左侧收藏夹 + 右侧文章列表）
// 功能对应：/favorites 页
// 维护指引：
//   - 样式 → FavoritesPanel.css
//   - 分页 → components/FavoritesPagination.js
//   - API → /api/favorites/folders
// ============================================================

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ArticleLink from "@/components/ArticleLink";
import FavoritesPagination, {
  FAVORITES_PAGE_SIZE,
} from "@/components/FavoritesPagination";
import "./FavoritesPanel.css";

/**
 * FavoritesPanel - 收藏夹管理面板
 * @param {Object} props
 * @param {Array} props.initialFolders - 服务端预取的收藏夹列表
 * @param {string|null} props.initialFolderId - 默认选中的收藏夹 ID
 * @param {Array} props.initialArticles - 默认收藏夹内的文章
 */
export default function FavoritesPanel({
  initialFolders = [],
  initialFolderId = null,
  initialArticles = [],
}) {
  const [folders, setFolders] = useState(initialFolders);
  const [activeFolderId, setActiveFolderId] = useState(initialFolderId);
  const [articles, setArticles] = useState(initialArticles);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [error, setError] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const activeFolder = folders.find((folder) => folder.id === activeFolderId);

  /** 当前收藏夹内文章的全部标签（去重排序） */
  const availableTags = useMemo(() => {
    const tagSet = new Set();
    for (const article of articles) {
      for (const tag of article.tags || []) {
        const trimmed = (tag || "").trim();
        if (trimmed) tagSet.add(trimmed);
      }
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }, [articles]);

  /** 按选中标签过滤后的文章列表 */
  const filteredArticles = useMemo(() => {
    if (!activeTag) return articles;
    return articles.filter((article) =>
      (article.tags || []).some((tag) => (tag || "").trim() === activeTag)
    );
  }, [articles, activeTag]);

  const totalCount = filteredArticles.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / FAVORITES_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  /** 当前页展示的文章（每页最多 15 条） */
  const paginatedArticles = useMemo(() => {
    const start = (safeCurrentPage - 1) * FAVORITES_PAGE_SIZE;
    return filteredArticles.slice(start, start + FAVORITES_PAGE_SIZE);
  }, [filteredArticles, safeCurrentPage]);

  useEffect(() => {
    setRenameValue(activeFolder?.name || "");
  }, [activeFolder?.name, activeFolderId]);

  useEffect(() => {
    setActiveTag("");
    setCurrentPage(1);
  }, [activeFolderId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTag]);

  async function loadFolderArticles(folderId) {
    setLoadingArticles(true);
    setError("");

    try {
      const response = await fetch(`/api/favorites/folders/${folderId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "加载失败");
      }
      setArticles(data.articles || []);
      setCurrentPage(1);
      setFolders((current) =>
        current.map((folder) =>
          folder.id === folderId
            ? { ...folder, name: data.folder.name, itemCount: data.articles.length }
            : folder
        )
      );
    } catch (loadError) {
      setError(loadError.message || "加载失败");
    } finally {
      setLoadingArticles(false);
    }
  }

  async function handleSelectFolder(folderId) {
    if (folderId === activeFolderId) return;
    setActiveFolderId(folderId);
    await loadFolderArticles(folderId);
  }

  async function handleCreateFolder(event) {
    event.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    setCreating(true);
    setError("");

    try {
      const response = await fetch("/api/favorites/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "创建失败");
      }

      setFolders((current) => [...current, data.folder]);
      setNewFolderName("");
      setShowCreateForm(false);
      setActiveFolderId(data.folder.id);
      setArticles([]);
      setCurrentPage(1);
    } catch (createError) {
      setError(createError.message || "创建失败");
    } finally {
      setCreating(false);
    }
  }

  async function handleRenameFolder(event) {
    event.preventDefault();
    const trimmed = renameValue.trim();
    if (!trimmed || !activeFolderId) return;

    setCreating(true);
    setError("");

    try {
      const response = await fetch(`/api/favorites/folders/${activeFolderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "重命名失败");
      }

      setFolders((current) =>
        current.map((folder) =>
          folder.id === activeFolderId ? data.folder : folder
        )
      );
      setRenaming(false);
    } catch (renameError) {
      setError(renameError.message || "重命名失败");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="favorites-panel">
      <aside className="favorites-sidebar" aria-label="收藏夹列表">
        <div className="favorites-sidebar-header">
          <h2 className="favorites-sidebar-title">我创建的收藏夹</h2>
          <button
            type="button"
            className="favorites-new-btn"
            onClick={() => setShowCreateForm((value) => !value)}
          >
            + 新建收藏夹
          </button>
        </div>

        {showCreateForm && (
          <form className="favorites-create-form" onSubmit={handleCreateFolder}>
            <input
              type="text"
              className="favorites-create-input"
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              placeholder="输入收藏夹名称"
              maxLength={30}
              autoFocus
            />
            <div className="favorites-create-actions">
              <button
                type="button"
                className="favorites-create-cancel"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewFolderName("");
                }}
              >
                取消
              </button>
              <button
                type="submit"
                className="favorites-create-submit"
                disabled={creating}
              >
                创建
              </button>
            </div>
          </form>
        )}

        <ul className="favorites-folder-list">
          {folders.map((folder) => (
            <li key={folder.id}>
              <button
                type="button"
                className={`favorites-folder-item${
                  folder.id === activeFolderId
                    ? " favorites-folder-item-active"
                    : ""
                }`}
                onClick={() => handleSelectFolder(folder.id)}
              >
                <span className="favorites-folder-name">{folder.name}</span>
                <span className="favorites-folder-count">
                  内容数: {folder.itemCount ?? 0}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="favorites-content">
        <div className="favorites-content-header">
          {renaming ? (
            <form className="favorites-rename-form" onSubmit={handleRenameFolder}>
              <input
                type="text"
                className="favorites-rename-input"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                maxLength={30}
                autoFocus
              />
              <button type="submit" className="favorites-rename-save" disabled={creating}>
                保存
              </button>
              <button
                type="button"
                className="favorites-rename-cancel"
                onClick={() => {
                  setRenaming(false);
                  setRenameValue(activeFolder?.name || "");
                }}
              >
                取消
              </button>
            </form>
          ) : (
            <div className="favorites-content-title-row">
              <h2 className="favorites-content-title">
                {activeFolder?.name || "收藏夹"}
              </h2>
              {activeFolder && (
                <button
                  type="button"
                  className="favorites-rename-btn"
                  onClick={() => setRenaming(true)}
                  title="重命名收藏夹"
                  aria-label="重命名收藏夹"
                >
                  ✎
                </button>
              )}
            </div>
          )}
        </div>

        {availableTags.length > 0 && (
          <div className="favorites-tag-nav" aria-label="标签筛选">
            <div className="favorites-tag-nav-scroll">
              <button
                type="button"
                className={`favorites-tag-nav-item${
                  !activeTag ? " favorites-tag-nav-item-active" : ""
                }`}
                onClick={() => setActiveTag("")}
              >
                全部
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`favorites-tag-nav-item${
                    activeTag === tag ? " favorites-tag-nav-item-active" : ""
                  }`}
                  onClick={() => setActiveTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="favorites-error">{error}</p>}

        {loadingArticles ? (
          <p className="favorites-loading">加载中...</p>
        ) : articles.length > 0 ? (
          filteredArticles.length > 0 ? (
            <>
              <ul className="favorites-article-list">
                {paginatedArticles.map((article) => (
                  <li key={article.id} className="favorites-article-item">
                    <ArticleLink href={`/article/${article.id}`} className="favorites-article-link">
                      <span className="favorites-article-tag">[BLOG]</span>
                      <span className="favorites-article-title">{article.title}</span>
                    </ArticleLink>
                    <span className="favorites-article-star" aria-hidden="true">
                      ★
                    </span>
                  </li>
                ))}
              </ul>
              <FavoritesPagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <div className="favorites-empty">
              <p>标签「{activeTag}」下暂无收藏文章</p>
              <button
                type="button"
                className="favorites-empty-link"
                onClick={() => setActiveTag("")}
              >
                查看全部
              </button>
            </div>
          )
        ) : (
          <div className="favorites-empty">
            <p>该收藏夹还没有收藏文章</p>
            <Link href="/" className="favorites-empty-link">
              去首页看看
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
