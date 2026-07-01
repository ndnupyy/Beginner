// ============================================================
// 文件作用：搜索发现「猜你想搜」混合推荐算法
// 功能对应：首页搜索框右侧推荐词（基于内容 + 热度 + 协同过滤）
// 算法参考：内容推荐 + 物品协同 + 热度加权混合（Hybrid Recommender）
// 维护指引：
//   - 推荐词不准 / 无结果 → 本文件
//   - 下拉 UI → components/ArticleSearchList.js
// ============================================================

import {
  countSharedTagsCaseInsensitive,
  normalizeTagKey,
} from "@/lib/tags";

// 混合推荐各维度权重（总和为 1）
const HYBRID_WEIGHTS = {
  content: 0.4,
  popularity: 0.35,
  collaborative: 0.25,
};

// 默认返回的推荐词数量
const DEFAULT_LIMIT = 5;
// 标记为「热门」的前几名
const HOT_TOP_N = 3;

// 常见虚词，生成候选词时过滤
const STOP_WORDS = new Set([
  "的",
  "了",
  "和",
  "与",
  "或",
  "在",
  "是",
  "有",
  "一个",
  "如何",
  "怎么",
  "什么",
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "of",
  "in",
  "for",
  "on",
  "with",
]);

/**
 * 从文章对象提取可搜索候选关键词
 * @param {{ title?: string, category?: string, tags?: string[] }} article
 * @returns {string[]}
 */
function extractKeywordsFromArticle(article) {
  const keywords = new Map();

  function addKeyword(value) {
    const trimmed = (value || "").trim();
    if (!trimmed || STOP_WORDS.has(trimmed.toLowerCase())) return;
    const key = trimmed.toLowerCase();
    if (!keywords.has(key)) {
      keywords.set(key, trimmed);
    }
  }

  if (article.category?.trim()) {
    addKeyword(article.category);
  }

  (article.tags || []).forEach((tag) => {
    addKeyword(tag);
  });

  const title = (article.title || "").trim();
  if (title) {
    addKeyword(title);

    title
      .split(/[\s,，、/|｜\-_:：;；.。·]+/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 2 && part.length <= 24)
      .forEach((part) => addKeyword(part));
  }

  return [...keywords.values()];
}

/**
 * 计算单篇文章热度分（阅读量 + 互动加权）
 * @param {{ views?: number, likes?: number, favorites?: number }} article
 * @returns {number}
 */
function getArticlePopularity(article) {
  const views = Number(article.views) || 0;
  const likes = Number(article.likes) || 0;
  const favorites = Number(article.favorites) || 0;
  return views + likes * 3 + favorites * 5;
}

/**
 * 判断关键词是否与文章相关
 * @param {string} keyword
 * @param {{ title?: string, category?: string, tags?: string[] }} article
 * @returns {boolean}
 */
function articleMatchesKeyword(keyword, article) {
  const lowerKeyword = keyword.toLowerCase();
  const title = (article.title || "").toLowerCase();
  const category = (article.category || "").toLowerCase();
  const tags = (article.tags || []).map((tag) => (tag || "").toLowerCase());

  return (
    title.includes(lowerKeyword) ||
    category === lowerKeyword ||
    tags.some((tag) => tag.includes(lowerKeyword) || lowerKeyword.includes(tag))
  );
}

/**
 * 根据搜索历史与浏览记录构建用户兴趣画像
 * @param {string[]} searchHistory
 * @param {object[]} browsedArticles
 * @param {object[]} allArticles
 * @returns {{ categories: Map<string, number>, tags: Map<string, number>, terms: Map<string, number> }}
 */
function buildUserInterestProfile(searchHistory, browsedArticles, allArticles) {
  const categories = new Map();
  const tags = new Map();
  const terms = new Map();

  /**
   * 将单篇文章偏好累加到画像中
   * @param {object} article
   * @param {number} weight
   */
  function absorbArticle(article, weight) {
    if (article.category?.trim()) {
      const key = article.category.trim();
      categories.set(key, (categories.get(key) || 0) + weight);
    }

  (article.tags || []).forEach((tag) => {
    const trimmed = (tag || "").trim();
    if (!trimmed) return;
    const key = normalizeTagKey(trimmed);
    tags.set(key, (tags.get(key) || 0) + weight);
  });

    extractKeywordsFromArticle(article).forEach((keyword) => {
      terms.set(keyword, (terms.get(keyword) || 0) + weight * 0.6);
    });
  }

  searchHistory.forEach((query) => {
    const trimmed = (query || "").trim();
    if (!trimmed) return;

    terms.set(trimmed, (terms.get(trimmed) || 0) + 4);

    allArticles.forEach((article) => {
      if (articleMatchesKeyword(trimmed, article)) {
        absorbArticle(article, 2);
      }
    });
  });

  browsedArticles.forEach((article) => {
    absorbArticle(article, 3);
  });

  return { categories, tags, terms };
}

/**
 * 基于内容的推荐得分：候选词与用户兴趣画像的匹配程度
 * @param {string} keyword
 * @param {ReturnType<typeof buildUserInterestProfile>} profile
 * @returns {number}
 */
function getContentBasedScore(keyword, profile) {
  const lowerKeyword = keyword.toLowerCase();
  let score = profile.terms.get(keyword) || 0;

  profile.categories.forEach((value, category) => {
    if (
      category.toLowerCase().includes(lowerKeyword) ||
      lowerKeyword.includes(category.toLowerCase())
    ) {
      score += value;
    }
  });

  profile.tags.forEach((value, tag) => {
    if (
      tag.toLowerCase().includes(lowerKeyword) ||
      lowerKeyword.includes(tag.toLowerCase())
    ) {
      score += value;
    }
  });

  return score;
}

/**
 * 热度推荐得分：关键词关联文章的总热度
 * @param {string} keyword
 * @param {object[]} articles
 * @returns {number}
 */
function getPopularityScore(keyword, articles) {
  let score = 0;

  articles.forEach((article) => {
    if (articleMatchesKeyword(keyword, article)) {
      score += getArticlePopularity(article);
    }
  });

  return score;
}

/**
 * 物品协同过滤得分：与用户感兴趣文章相似的其他文章中的关键词
 * @param {string} keyword
 * @param {object[]} seedArticles 用户浏览过或搜索命中过的文章
 * @param {object[]} allArticles
 * @returns {number}
 */
function getCollaborativeScore(keyword, seedArticles, allArticles) {
  if (seedArticles.length === 0) {
    return 0;
  }

  const seedIds = new Set(seedArticles.map((item) => item.id));
  let score = 0;

  seedArticles.forEach((sourceArticle) => {
    const sourceCategory = sourceArticle.category || "";

    allArticles.forEach((candidate) => {
      if (seedIds.has(candidate.id)) return;

      const sharedTagCount = countSharedTagsCaseInsensitive(
        sourceArticle.tags,
        candidate.tags
      );
      const sameCategory =
        sourceCategory &&
        candidate.category &&
        sourceCategory === candidate.category;

      if (sharedTagCount === 0 && !sameCategory) return;
      if (!articleMatchesKeyword(keyword, candidate)) return;

      score += sharedTagCount * 2 + (sameCategory ? 3 : 0);
    });
  });

  return score;
}

/**
 * 汇总用户感兴趣种子文章（浏览记录 + 搜索历史命中文章）
 * @param {string[]} searchHistory
 * @param {object[]} browsedArticles
 * @param {object[]} allArticles
 * @returns {object[]}
 */
function collectSeedArticles(searchHistory, browsedArticles, allArticles) {
  const seeds = [...browsedArticles];
  const seedIds = new Set(seeds.map((item) => item.id));

  searchHistory.forEach((query) => {
    const trimmed = (query || "").trim();
    if (!trimmed) return;

    allArticles.forEach((article) => {
      if (seedIds.has(article.id)) return;
      if (articleMatchesKeyword(trimmed, article)) {
        seeds.push(article);
        seedIds.add(article.id);
      }
    });
  });

  return seeds;
}

/**
 * 将某一维度的原始得分归一化到 0~1
 * @param {Map<string, number>} scoreMap
 * @returns {Map<string, number>}
 */
function normalizeScores(scoreMap) {
  const max = Math.max(...scoreMap.values(), 1);
  const normalized = new Map();

  scoreMap.forEach((value, key) => {
    normalized.set(key, value / max);
  });

  return normalized;
}

/**
 * 生成搜索发现推荐词（混合推荐）
 * @param {{
 *   articles?: object[],
 *   searchHistory?: string[],
 *   browsedArticles?: string[],
 *   limit?: number,
 * }} options
 * @returns {{ keyword: string, score: number, hot: boolean }[]}
 */
export function getSearchDiscoverySuggestions({
  articles = [],
  searchHistory = [],
  browsedArticles = [],
  limit = DEFAULT_LIMIT,
} = {}) {
  if (!articles.length) return [];

  const historySet = new Set(
    searchHistory.map((item) => item.trim().toLowerCase()).filter(Boolean)
  );

  const profile = buildUserInterestProfile(
    searchHistory,
    browsedArticles,
    articles
  );
  const seedArticles = collectSeedArticles(
    searchHistory,
    browsedArticles,
    articles
  );

  const candidateSet = new Set();
  articles.forEach((article) => {
    extractKeywordsFromArticle(article).forEach((keyword) => {
      candidateSet.add(keyword);
    });
  });

  const contentScores = new Map();
  const popularityScores = new Map();
  const collaborativeScores = new Map();

  candidateSet.forEach((keyword) => {
    const lowerKeyword = keyword.toLowerCase();
    if (historySet.has(lowerKeyword)) return;

    contentScores.set(keyword, getContentBasedScore(keyword, profile));
    popularityScores.set(keyword, getPopularityScore(keyword, articles));
    collaborativeScores.set(
      keyword,
      getCollaborativeScore(keyword, seedArticles, articles)
    );
  });

  if (contentScores.size === 0) {
    articles
      .slice()
      .sort((a, b) => getArticlePopularity(b) - getArticlePopularity(a))
      .slice(0, limit)
      .forEach((article) => {
        extractKeywordsFromArticle(article).forEach((keyword) => {
          if (!historySet.has(keyword.toLowerCase())) {
            candidateSet.add(keyword);
            contentScores.set(keyword, 0);
            popularityScores.set(keyword, getPopularityScore(keyword, articles));
            collaborativeScores.set(keyword, 0);
          }
        });
      });
  }

  const normalizedContent = normalizeScores(contentScores);
  const normalizedPopularity = normalizeScores(popularityScores);
  const normalizedCollaborative = normalizeScores(collaborativeScores);

  const merged = [];

  candidateSet.forEach((keyword) => {
    if (historySet.has(keyword.toLowerCase())) return;
    if (!popularityScores.has(keyword)) return;

    const score =
      (normalizedContent.get(keyword) || 0) * HYBRID_WEIGHTS.content +
      (normalizedPopularity.get(keyword) || 0) * HYBRID_WEIGHTS.popularity +
      (normalizedCollaborative.get(keyword) || 0) * HYBRID_WEIGHTS.collaborative;

    if (score <= 0) return;

    merged.push({ keyword, score });
  });

  merged.sort((a, b) => b.score - a.score);

  const deduped = [];
  const seen = new Set();

  merged.forEach((item) => {
    const key = item.keyword.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(item);
  });

  return deduped.slice(0, limit).map((item, index) => ({
    keyword: item.keyword,
    score: item.score,
    hot: index < HOT_TOP_N,
  }));
}
