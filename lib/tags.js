// ============================================================
// 文件作用：文章标签规范化与检索（不区分大小写）
// 功能对应：历史/收藏标签筛选、发文设置去重、搜索推荐协同过滤
// 维护指引：java 与 Java 应视为同一标签时 → 本文件
// ============================================================

/**
 * 标签比较用规范化键（去首尾空格 + 小写）
 * @param {string} tag
 * @returns {string}
 */
export function normalizeTagKey(tag) {
  return (tag || "").trim().toLowerCase();
}

/**
 * 判断两个标签是否相同（不区分大小写）
 * @param {string} tagA
 * @param {string} tagB
 * @returns {boolean}
 */
export function isSameTag(tagA, tagB) {
  const keyA = normalizeTagKey(tagA);
  const keyB = normalizeTagKey(tagB);
  return Boolean(keyA) && keyA === keyB;
}

/**
 * 文章是否包含目标标签（不区分大小写）
 * @param {string[]} articleTags
 * @param {string} targetTag
 * @returns {boolean}
 */
export function articleHasTag(articleTags, targetTag) {
  const key = normalizeTagKey(targetTag);
  if (!key) return false;
  return (articleTags || []).some((tag) => normalizeTagKey(tag) === key);
}

/**
 * 从多组标签列表收集去重后的展示标签（同键只保留首次出现的原文）
 * @param {string[][]} tagLists
 * @returns {string[]}
 */
export function collectUniqueTags(tagLists) {
  const displayByKey = new Map();

  for (const tags of tagLists) {
    for (const tag of tags || []) {
      const trimmed = (tag || "").trim();
      if (!trimmed) continue;

      const key = normalizeTagKey(trimmed);
      if (!displayByKey.has(key)) {
        displayByKey.set(key, trimmed);
      }
    }
  }

  return Array.from(displayByKey.values()).sort((a, b) =>
    a.localeCompare(b, "zh-CN", { sensitivity: "base" })
  );
}

/**
 * 从文章列表收集去重标签
 * @param {Array<{ tags?: string[] }>} articles
 * @returns {string[]}
 */
export function collectUniqueTagsFromArticles(articles) {
  return collectUniqueTags(articles.map((article) => article.tags));
}

/**
 * 在标签数组中查找与目标标签同键的展示文本
 * @param {string[]} tags
 * @param {string} targetTag
 * @returns {string|null}
 */
export function findTagDisplayLabel(tags, targetTag) {
  const key = normalizeTagKey(targetTag);
  if (!key) return null;

  const matched = (tags || []).find((tag) => normalizeTagKey(tag) === key);
  return matched ? matched.trim() : null;
}

/**
 * 判断两组标签是否存在交集（不区分大小写）
 * @param {string[]} tagsA
 * @param {string[]} tagsB
 * @returns {boolean}
 */
export function tagsOverlapCaseInsensitive(tagsA, tagsB) {
  const keySet = new Set(
    (tagsA || []).map((tag) => normalizeTagKey(tag)).filter(Boolean)
  );
  return (tagsB || []).some((tag) => keySet.has(normalizeTagKey(tag)));
}

/**
 * 统计两组标签中同键标签的数量
 * @param {string[]} tagsA
 * @param {string[]} tagsB
 * @returns {number}
 */
export function countSharedTagsCaseInsensitive(tagsA, tagsB) {
  const keySet = new Set(
    (tagsA || []).map((tag) => normalizeTagKey(tag)).filter(Boolean)
  );
  const sharedKeys = new Set();

  for (const tag of tagsB || []) {
    const key = normalizeTagKey(tag);
    if (key && keySet.has(key)) {
      sharedKeys.add(key);
    }
  }

  return sharedKeys.size;
}
