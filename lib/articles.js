// ============================================================
// 文件作用：文章数据的读写工具（相当于 Java 中的 Service 层）
// 功能对应：所有 CRUD 操作的数据底层逻辑
// 如果文章保存/读取出问题，优先检查这个文件
// ============================================================

// 引入 Node.js 内置的文件系统模块，用于读写 JSON 文件
import fs from "fs";
// 引入路径处理模块，用于拼接文件路径（跨平台兼容 Windows/Mac/Linux）
import path from "path";

// 文章 JSON 文件的完整路径
// process.cwd() 返回项目根目录，类似 Java 中获取项目根路径
const DATA_FILE = path.join(process.cwd(), "data", "articles.json");

/**
 * 从 JSON 文件读取所有文章
 * @returns {Array} 文章数组
 */
export function getAllArticles() {
  // 读取文件内容为字符串，utf-8 是中文编码格式
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  // 将 JSON 字符串解析为 JavaScript 对象数组
  const articles = JSON.parse(raw);
  // 按创建时间倒序排列（最新的文章排在最前面）
  return articles.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

/**
 * 根据 ID 查找单篇文章
 * @param {string} id - 文章唯一标识
 * @returns {Object|null} 找到的文章对象，找不到返回 null
 */
export function getArticleById(id) {
  // 获取所有文章
  const articles = getAllArticles();
  // 用 find 方法查找 id 匹配的文章（类似 Java Stream 的 filter + findFirst）
  return articles.find((article) => article.id === id) || null;
}

/**
 * 将文章数组写入 JSON 文件（内部工具函数，不对外导出）
 * @param {Array} articles - 要保存的文章数组
 */
function saveArticles(articles) {
  // JSON.stringify 的第三个参数 2 表示缩进 2 空格，让文件更易读
  fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2), "utf-8");
}

/**
 * 创建新文章（Create - 增）
 * @param {Object} articleData - 前端传来的文章数据
 * @returns {Object} 创建成功的完整文章对象
 */
export function createArticle(articleData) {
  // 读取现有文章列表
  const articles = getAllArticles();
  // 生成唯一 ID（使用 Node.js 内置的 UUID 生成器）
  const newArticle = {
    // crypto.randomUUID() 生成类似 "a1b2c3d4-..." 的唯一字符串
    id: crypto.randomUUID(),
    // 文章标题，如果没传就用空字符串
    title: articleData.title || "",
    // 文章正文内容
    content: articleData.content || "",
    // 文章摘要（首页卡片上显示的简介）
    summary: articleData.summary || "",
    // 作者名称，默认"博客作者"
    authorName: articleData.authorName || "博客作者",
    // 作者头像 URL
    authorAvatar: articleData.authorAvatar || "/default-avatar.svg",
    // 封面缩略图 URL
    thumbnailUrl: articleData.thumbnailUrl || "",
    // 文章标签数组
    tags: articleData.tags || [],
    // 分类专栏名称
    category: articleData.category || "",
    // 文章类型：原创 / 转载 / 翻译
    articleType: articleData.articleType || "原创",
    // 可见范围：全部可见 / 仅我可见 等
    visibility: articleData.visibility || "全部可见",
    // 初始阅读量为 0
    views: 0,
    // 记录创建时间和更新时间（ISO 格式字符串）
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  // 将新文章添加到数组开头
  articles.unshift(newArticle);
  // 保存到文件
  saveArticles(articles);
  // 返回新创建的文章
  return newArticle;
}

/**
 * 更新已有文章（Update - 改）
 * @param {string} id - 要更新的文章 ID
 * @param {Object} updates - 要更新的字段
 * @returns {Object|null} 更新后的文章，找不到返回 null
 */
export function updateArticle(id, updates) {
  // 读取所有文章
  const articles = getAllArticles();
  // 找到要更新的文章在数组中的索引位置
  const index = articles.findIndex((article) => article.id === id);
  // 如果找不到（index 为 -1），返回 null
  if (index === -1) return null;
  // 合并旧数据和新数据，并更新 updatedAt 时间戳
  articles[index] = {
    ...articles[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  // 保存到文件
  saveArticles(articles);
  // 返回更新后的文章
  return articles[index];
}

/**
 * 删除文章（Delete - 删）
 * @param {string} id - 要删除的文章 ID
 * @returns {boolean} 删除成功返回 true，找不到返回 false
 */
export function deleteArticle(id) {
  // 读取所有文章
  const articles = getAllArticles();
  // 过滤掉 id 匹配的文章，保留其余文章
  const filtered = articles.filter((article) => article.id !== id);
  // 如果长度没变，说明没找到要删的文章
  if (filtered.length === articles.length) return false;
  // 保存过滤后的列表
  saveArticles(filtered);
  return true;
}

/**
 * 增加文章阅读量（Read 时调用）
 * @param {string} id - 文章 ID
 * @returns {Object|null} 更新后的文章
 */
export function incrementViews(id) {
  // 先找到文章
  const article = getArticleById(id);
  // 找不到就返回 null
  if (!article) return null;
  // 阅读量 +1 并保存
  return updateArticle(id, { views: article.views + 1 });
}

/**
 * 格式化阅读量显示（如 2900 → "2.9k"）
 * @param {number} views - 阅读数量
 * @returns {string} 格式化后的字符串
 */
export function formatViews(views) {
  // 超过 1000 时显示 k 单位
  if (views >= 1000) {
    // 保留一位小数，如 2900 → "2.9k"
    return (views / 1000).toFixed(1) + "k";
  }
  // 不足 1000 直接显示数字
  return String(views);
}
