// ============================================================
// 文件作用：单篇文章 API 路由 - 处理「查单篇 / 改 / 删」
// 访问地址：GET    /api/articles/[id]  → 获取单篇文章
//           PUT    /api/articles/[id]  → 更新文章
//           DELETE /api/articles/[id]  → 删除文章
// 功能对应：文章详情页、编辑页、删除按钮
// 如果某篇文章打不开 / 编辑保存失败 / 删除无效，检查这个文件
// ============================================================

import {
  getArticleById,
  updateArticle,
  deleteArticle,
  incrementViews,
} from "@/lib/articles";
import { NextResponse } from "next/server";

/**
 * GET - 获取单篇文章详情（Read - 查单篇）
 * @param {Object} context - 包含路由参数 params
 *   params.id 就是 URL 中的 [id]，如 /api/articles/abc123 中的 abc123
 */
export async function GET(request, { params }) {
  try {
    // 从 URL 参数中获取文章 ID（Next.js 16 中 params 可能是 Promise，需要 await）
    const { id } = await params;
    // 根据 ID 查找文章
    const article = await getArticleById(id);
    if (!article) {
      return NextResponse.json(
        { error: "文章不存在" },
        { status: 404 }
      );
    }
    const url = new URL(request.url);
    if (url.searchParams.get("countView") === "true") {
      await incrementViews(id);
      const updated = await getArticleById(id);
      return NextResponse.json(updated);
    }
    // 正常返回文章数据
    return NextResponse.json(article);
  } catch (error) {
    return NextResponse.json(
      { error: "获取文章失败" },
      { status: 500 }
    );
  }
}

/**
 * PUT - 更新文章（Update - 改）
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    // 解析前端传来的更新数据
    const body = await request.json();
    // 校验标题长度
    if (body.title && body.title.length < 5) {
      return NextResponse.json(
        { error: "标题至少需要 5 个字" },
        { status: 400 }
      );
    }
    // 执行更新
    const updated = await updateArticle(id, body);
    if (!updated) {
      return NextResponse.json(
        { error: "文章不存在" },
        { status: 404 }
      );
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "更新文章失败" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - 删除文章（Delete - 删）
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    // 执行删除
    const success = await deleteArticle(id);
    if (!success) {
      return NextResponse.json(
        { error: "文章不存在" },
        { status: 404 }
      );
    }
    // 返回成功消息
    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    return NextResponse.json(
      { error: "删除文章失败" },
      { status: 500 }
    );
  }
}
