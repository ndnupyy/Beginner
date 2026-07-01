// ============================================================
// 文件作用：首页搜索历史（浏览器 localStorage 持久化）
// 功能对应：首页搜索框聚焦时展示近 5 条历史记录
// 维护指引：
//   - 历史不显示 / 无法清空 → 本文件
//   - 下拉 UI → components/ArticleSearchList.js
// ============================================================

// localStorage 键名，仅存储首页文章标题搜索关键词
const STORAGE_KEY = "article-search-history";
// 最多保留的搜索记录条数
const MAX_ITEMS = 5;

/**
 * 读取搜索历史（最新在前）
 * @returns {string[]}
 */
export function getSearchHistory() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

/**
 * 写入一条搜索记录（去重后置顶，最多保留 MAX_ITEMS 条）
 * @param {string} keyword
 * @returns {string[]}
 */
export function addSearchHistory(keyword) {
  const trimmed = (keyword || "").trim();
  if (!trimmed || typeof window === "undefined") {
    return getSearchHistory();
  }

  const nextHistory = [
    trimmed,
    ...getSearchHistory().filter(
      (item) => item.toLowerCase() !== trimmed.toLowerCase()
    ),
  ].slice(0, MAX_ITEMS);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
  } catch {
    // 存储失败时静默忽略，不影响正常搜索
  }

  return nextHistory;
}

/**
 * 清空全部搜索历史
 * @returns {string[]}
 */
export function clearSearchHistory() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 清空失败时静默忽略
    }
  }

  return [];
}
