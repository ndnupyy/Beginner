// ============================================================
// 文件作用：首页 URL 参数拼装（分类、搜索、分页）
// 功能对应：/?category=xxx&q=xxx&page=2
// 维护指引：首页筛选 / 分页跳转 → 本文件
// ============================================================

/**
 * 拼装首页 URL，切换分类或搜索时会自动重置到第 1 页
 * @param {URLSearchParams} searchParams
 * @param {{ category?: string, q?: string, page?: number }} updates
 */
export function buildHomeUrl(searchParams, updates = {}) {
  const params = new URLSearchParams(searchParams.toString());

  if ("category" in updates) {
    if (updates.category) params.set("category", updates.category);
    else params.delete("category");
    params.delete("page");
  }

  if ("q" in updates) {
    if (updates.q) params.set("q", updates.q);
    else params.delete("q");
    params.delete("page");
  }

  if ("page" in updates) {
    if (updates.page && updates.page > 1) {
      params.set("page", String(updates.page));
    } else {
      params.delete("page");
    }
  }

  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}
