// ============================================================
// 文件作用：文章数据的读写工具（相当于 Java 中的 Service 层）
// 功能对应：所有 CRUD 操作的数据底层逻辑
// 数据存储：SQLite 数据库（data/blog.db），不再是 JSON 文件
// 如果文章保存/读取出问题，优先检查这个文件和 lib/db.js
// ============================================================

// 从 db.js 导入数据库连接和行转换函数
import { getDb, rowToArticle } from "@/lib/db";
import { getUserById } from "@/lib/users";

/**
 * 读取文章时，若有关联 author_id，则用 users 表中最新的用户名和头像
 * @param {Object} row - articles 表一行
 * @returns {Object} 前端使用的文章对象
 */
function enrichArticleRow(row) {
  const article = rowToArticle(row);

  if (row.author_id) {
    const user = getUserById(row.author_id);
    if (user) {
      article.authorName = user.username;
      article.authorAvatar = user.avatarUrl;
    }
  }

  return article;
}

/**
 * 从 SQLite 数据库读取所有文章
 * @returns {Array} 文章数组（按创建时间倒序）
 */
export function getAllArticles() {
  // 获取数据库连接
  const db = getDb();
  // 查询所有文章，按 created_at 倒序（最新的在前）
  const rows = db
    .prepare("SELECT * FROM articles ORDER BY created_at DESC")
    .all();
  // 把每一行数据库记录转成前端用的对象格式
  return rows.map(enrichArticleRow);
}

/**
 * 根据 ID 查找单篇文章
 * @param {string} id - 文章唯一标识
 * @returns {Object|null} 找到的文章对象，找不到返回 null
 */
export function getArticleById(id) {
  const db = getDb();
  // 用 ? 占位符防止 SQL 注入（类似 Java PreparedStatement 的 ?）
  const row = db.prepare("SELECT * FROM articles WHERE id = ?").get(id);
  // 找不到返回 null，找到了转成对象返回
  return row ? enrichArticleRow(row) : null;
}

/**
 * 创建新文章（Create - 增）
 * @param {Object} articleData - 前端传来的文章数据
 * @returns {Object} 创建成功的完整文章对象
 */
export function createArticle(articleData) {
  const db = getDb();
  // 生成唯一 ID
  const id = crypto.randomUUID();
  // 当前时间（ISO 格式字符串）
  const now = new Date().toISOString();

  // 预编译 INSERT 语句
  const insert = db.prepare(`
    INSERT INTO articles (
      id, title, content, summary, tags, thumbnail_url,
      category, article_type, visibility, author_id, author_name, author_avatar,
      views, created_at, updated_at
    ) VALUES (
      @id, @title, @content, @summary, @tags, @thumbnail_url,
      @category, @article_type, @visibility, @author_id, @author_name, @author_avatar,
      @views, @created_at, @updated_at
    )
  `);

  const row = {
    id,
    title: articleData.title || "",
    content: articleData.content || "",
    summary: articleData.summary || "",
    tags: JSON.stringify(articleData.tags || []),
    thumbnail_url: articleData.thumbnailUrl || "",
    category: articleData.category || "",
    article_type: articleData.articleType || "原创",
    visibility: articleData.visibility || "全部可见",
    author_id: articleData.authorId || null,
    author_name: articleData.authorName || "博客作者",
    author_avatar: articleData.authorAvatar || "/default-avatar.svg",
    views: 0,
    created_at: now,
    updated_at: now,
  };

  insert.run(row);

  return enrichArticleRow(row);
}

/**
 * 更新已有文章（Update - 改）
 * @param {string} id - 要更新的文章 ID
 * @param {Object} updates - 要更新的字段（camelCase 格式）
 * @returns {Object|null} 更新后的文章，找不到返回 null
 */
export function updateArticle(id, updates) {
  const db = getDb();
  // 先确认文章存在
  const existing = getArticleById(id);
  if (!existing) return null;

  // 把前端 camelCase 字段名映射为数据库 snake_case 字段名
  const fieldMap = {
    title: "title",
    content: "content",
    summary: "summary",
    tags: "tags",
    thumbnailUrl: "thumbnail_url",
    category: "category",
    articleType: "article_type",
    visibility: "visibility",
    authorName: "author_name",
    authorAvatar: "author_avatar",
    views: "views",
  };

  // 动态构建 UPDATE 语句的 SET 部分
  const setClauses = [];
  const params = { id };

  for (const [camelKey, snakeKey] of Object.entries(fieldMap)) {
    // 只更新前端传了值的字段
    if (updates[camelKey] !== undefined) {
      setClauses.push(`${snakeKey} = @${snakeKey}`);
      // tags 数组需要转成 JSON 字符串再存
      params[snakeKey] =
        camelKey === "tags"
          ? JSON.stringify(updates[camelKey])
          : updates[camelKey];
    }
  }

  // 始终更新 updated_at 时间
  const now = new Date().toISOString();
  setClauses.push("updated_at = @updated_at");
  params.updated_at = now;

  // 执行 UPDATE
  db.prepare(
    `UPDATE articles SET ${setClauses.join(", ")} WHERE id = @id`
  ).run(params);

  // 返回更新后的文章
  return getArticleById(id);
}

/**
 * 删除文章（Delete - 删）
 * @param {string} id - 要删除的文章 ID
 * @returns {boolean} 删除成功返回 true，找不到返回 false
 */
export function deleteArticle(id) {
  const db = getDb();
  // run() 返回 { changes: 影响行数 }
  const result = db.prepare("DELETE FROM articles WHERE id = ?").run(id);
  // changes > 0 表示确实删到了一行
  return result.changes > 0;
}

/**
 * 增加文章阅读量（Read 时调用）
 * @param {string} id - 文章 ID
 * @returns {Object|null} 更新后的文章
 */
export function incrementViews(id) {
  const article = getArticleById(id);
  if (!article) return null;
  return updateArticle(id, { views: article.views + 1 });
}