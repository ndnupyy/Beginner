// ============================================================
// 文件作用：SQLite 数据库连接与初始化
// 功能对应：创建数据库文件、建表、首次启动时导入示例数据
// 如果数据库连接失败 / 表不存在，检查这个文件
// ============================================================

// better-sqlite3：Node.js 的 SQLite 驱动（类似 Java 的 JDBC 连接 SQLite）
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// 数据库文件路径：保存在 data/blog.db
const DB_PATH = path.join(process.cwd(), "data", "blog.db");

// 缓存数据库连接（单例模式：整个应用只用一个连接，类似 Java 连接池中的一个连接）
let db = null;

/**
 * 获取数据库连接（如果还没连接就先创建）
 * @returns {Database} SQLite 数据库实例
 */
export function getDb() {
  // 如果已经有连接，直接返回（避免重复打开文件）
  if (db) return db;

  // 确保 data 目录存在（没有就自动创建）
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  // 打开（或创建）SQLite 数据库文件
  db = new Database(DB_PATH);

  // 开启 WAL 模式，提升读写性能（SQLite 的优化选项）
  db.pragma("journal_mode = WAL");

  // 创建 articles 表（如果不存在）
  initTables(db);

  // 如果表是空的，从 articles.json 导入示例数据
  seedIfEmpty(db);

  return db;
}

/**
 * 创建 articles 表
 * 字段对应发布文章时需要填写的所有内容
 * @param {Database} database - 数据库实例
 */
function initTables(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id              TEXT PRIMARY KEY,
      title           TEXT NOT NULL,
      content         TEXT NOT NULL,
      summary         TEXT DEFAULT '',
      tags            TEXT DEFAULT '[]',
      thumbnail_url   TEXT DEFAULT '',
      category        TEXT DEFAULT '',
      article_type    TEXT DEFAULT '原创',
      visibility      TEXT DEFAULT '全部可见',
      author_name     TEXT DEFAULT '博客作者',
      author_avatar   TEXT DEFAULT '/default-avatar.svg',
      views           INTEGER DEFAULT 0,
      created_at      TEXT NOT NULL,
      updated_at      TEXT NOT NULL
    )
  `);
}

/**
 * 首次启动时，如果数据库里没有文章，从 articles.json 导入示例数据
 * @param {Database} database - 数据库实例
 */
function seedIfEmpty(database) {
  // 查询当前有多少篇文章
  const row = database.prepare("SELECT COUNT(*) AS count FROM articles").get();
  // 如果已有数据，不需要导入
  if (row.count > 0) return;

  // 尝试读取旧的 JSON 示例数据文件
  const jsonPath = path.join(process.cwd(), "data", "articles.json");
  if (!fs.existsSync(jsonPath)) return;

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const articles = JSON.parse(raw);

  // 预编译 INSERT 语句（重复使用性能更好，类似 Java 的 PreparedStatement）
  const insert = database.prepare(`
    INSERT INTO articles (
      id, title, content, summary, tags, thumbnail_url,
      category, article_type, visibility, author_name, author_avatar,
      views, created_at, updated_at
    ) VALUES (
      @id, @title, @content, @summary, @tags, @thumbnail_url,
      @category, @article_type, @visibility, @author_name, @author_avatar,
      @views, @created_at, @updated_at
    )
  `);

  // 用事务批量插入（要么全部成功，要么全部失败，保证数据一致性）
  const insertMany = database.transaction((items) => {
    for (const item of items) {
      insert.run({
        id: item.id,
        title: item.title,
        content: item.content,
        summary: item.summary || "",
        // 标签数组存成 JSON 字符串（SQLite 没有数组类型）
        tags: JSON.stringify(item.tags || []),
        thumbnail_url: item.thumbnailUrl || "",
        category: item.category || "",
        article_type: item.articleType || "原创",
        visibility: item.visibility || "全部可见",
        author_name: item.authorName || "博客作者",
        author_avatar: item.authorAvatar || "/default-avatar.svg",
        views: item.views || 0,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      });
    }
  });

  insertMany(articles);
}

/**
 * 将数据库行（snake_case 字段名）转为前端用的对象（camelCase 字段名）
 * 类似 Java 中 Entity → DTO 的转换
 * @param {Object} row - 数据库查询返回的一行
 * @returns {Object} 前端使用的文章对象
 */
export function rowToArticle(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    summary: row.summary,
    // 从 JSON 字符串解析回数组
    tags: JSON.parse(row.tags || "[]"),
    thumbnailUrl: row.thumbnail_url,
    category: row.category,
    articleType: row.article_type,
    visibility: row.visibility,
    authorName: row.author_name,
    authorAvatar: row.author_avatar,
    views: row.views,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
