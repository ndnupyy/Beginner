// ============================================================
// 文件作用：文章详情页跳转过渡（离场动画时长与 class 名）
// 功能对应：ArticleLink 点击离场、SiteShell 入场动画
// 维护指引：动画太快/太慢 → 调整 ARTICLE_LEAVE_MS
// ============================================================

// 离场动画持续时间（毫秒）
export const ARTICLE_LEAVE_MS = 240;

// 挂在 html 上的离场 class
export const ARTICLE_LEAVE_CLASS = "article-page-leaving";

/**
 * 开始文章页离场过渡
 */
export function startArticleLeaveTransition() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.add(ARTICLE_LEAVE_CLASS);
}

/**
 * 结束文章页离场过渡
 */
export function endArticleLeaveTransition() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove(ARTICLE_LEAVE_CLASS);
}

/**
 * 判断是否应使用文章过渡（仅站内左键同页跳转）
 * @param {MouseEvent} event
 * @returns {boolean}
 */
export function shouldAnimateArticleNavigation(event) {
  return !(
    event.defaultPrevented ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}
