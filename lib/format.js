// ============================================================
// 文件作用：通用格式化工具函数（纯 JS，可在客户端和服务端使用）
// 功能对应：阅读量等数据的展示格式化
// ============================================================

/**
 * 格式化阅读量显示（如 2900 → "2.9k"）
 * @param {number} views - 阅读数量
 * @returns {string} 格式化后的字符串
 */
export function formatViews(views) {
  return formatCount(views);
}

/**
 * 格式化数量显示（阅读量、点赞、收藏等）
 * @param {number} value
 * @returns {string}
 */
export function formatCount(value) {
  const num = Number(value) || 0;
  if (num >= 10000) {
    return Math.floor(num / 10000) + "万+";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return String(num);
}

/** 作者统计栏展示（如 913、1万+） */
export function formatStatCount(value) {
  const num = Number(value) || 0;
  if (num >= 10000) {
    return Math.floor(num / 10000) + "万+";
  }
  return String(num);
}

/**
 * 相对时间展示（如 1天前、3小时前）
 * @param {string|Date} input - ISO 时间或 Date
 * @returns {string}
 */
export function formatRelativeTime(input) {
  if (!input) return "";

  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return "刚刚";

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "刚刚";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}分钟前`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}小时前`;
  if (diffMs < day * 30) return `${Math.floor(diffMs / day)}天前`;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
}
