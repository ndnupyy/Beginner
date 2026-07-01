// ============================================================
// 文件作用：功能页（历史、收藏等）侧边栏跳转过渡
// 功能对应：Sidebar 点击离场、SiteShell 入场动画
// 维护指引：动画太快/太慢 → 调整 FUNCTIONAL_LEAVE_MS
// ============================================================

// 离场动画持续时间（毫秒）
export const FUNCTIONAL_LEAVE_MS = 220;

// 挂在 html 上的离场 class
export const FUNCTIONAL_LEAVE_CLASS = "functional-page-leaving";

/**
 * 开始功能页离场过渡
 */
export function startFunctionalLeaveTransition() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.add(FUNCTIONAL_LEAVE_CLASS);
}

/**
 * 结束功能页离场过渡
 */
export function endFunctionalLeaveTransition() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove(FUNCTIONAL_LEAVE_CLASS);
}

/**
 * 判断是否应使用功能页过渡（仅站内左键同页跳转）
 * @param {MouseEvent} event
 * @returns {boolean}
 */
export function shouldAnimateFunctionalNavigation(event) {
  return !(
    event.defaultPrevented ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}
