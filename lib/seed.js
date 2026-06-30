// ============================================================
// 文件作用：首次启动时从 articles.json 导入示例文章
// 功能对应：替代原 lib/db.js 中的 seedIfEmpty
// 维护指引：示例数据变更 → data/articles.json + 本文件
// ============================================================

import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export async function ensureSeeded() {
  const count = await prisma.articles.count();
  if (count > 0) return;

  const jsonPath = path.join(process.cwd(), "data", "articles.json");
  if (!fs.existsSync(jsonPath)) return;

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const articles = JSON.parse(raw);

  await prisma.articles.createMany({
    data: articles.map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      summary: item.summary || "",
      tags: JSON.stringify(item.tags || []),
      thumbnail_url: item.thumbnailUrl || "",
      category: item.category || "",
      article_type: item.articleType || "原创",
      visibility: item.visibility || "全部可见",
      author_name: item.authorName || "博客作者",
      author_avatar: item.authorAvatar || "/default-avatar.svg",
      views: item.views || 0,
      likes: 0,
      favorites: 0,
      status: "published",
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    })),
  });
}
