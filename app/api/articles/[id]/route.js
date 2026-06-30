// ============================================================
// 文件作用：单篇文章 API 路由
// 访问地址：GET/PUT/DELETE /api/articles/[id]
// ============================================================

import {
  getArticleById,
  updateArticle,
  deleteArticle,
  incrementViews,
  ARTICLE_STATUS,
} from "@/lib/articles";
import { getSessionUserId } from "@/lib/session";
import { getContentPlainText } from "@/lib/contentFormat";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const article = await getArticleById(id);
    if (!article) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    if (article.status === ARTICLE_STATUS.draft) {
      const userId = await getSessionUserId();
      if (!userId || userId !== article.authorId) {
        return NextResponse.json({ error: "文章不存在" }, { status: 404 });
      }
    }

    const url = new URL(request.url);
    if (
      url.searchParams.get("countView") === "true" &&
      article.status === ARTICLE_STATUS.published
    ) {
      await incrementViews(id);
      const updated = await getArticleById(id);
      return NextResponse.json(updated);
    }

    return NextResponse.json(article);
  } catch {
    return NextResponse.json({ error: "获取文章失败" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existing = await getArticleById(id);
    if (!existing) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const userId = await getSessionUserId();
    if (!userId || userId !== existing.authorId) {
      return NextResponse.json({ error: "无权编辑此文章" }, { status: 403 });
    }

    const nextStatus =
      body.status === ARTICLE_STATUS.draft
        ? ARTICLE_STATUS.draft
        : body.status === ARTICLE_STATUS.published
        ? ARTICLE_STATUS.published
        : existing.status;

    const mergedTitle = body.title ?? existing.title;
    const mergedContent = body.content ?? existing.content;

    if (nextStatus === ARTICLE_STATUS.published) {
      if (!mergedTitle || mergedTitle.length < 5) {
        return NextResponse.json(
          { error: "标题至少需要 5 个字" },
          { status: 400 }
        );
      }
      if (!getContentPlainText(mergedContent)) {
        return NextResponse.json(
          { error: "文章内容不能为空" },
          { status: 400 }
        );
      }
    }

    const updated = await updateArticle(id, {
      ...body,
      status: body.status !== undefined ? nextStatus : undefined,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "更新文章失败" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const existing = await getArticleById(id);
    if (!existing) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const userId = await getSessionUserId();
    if (!userId || userId !== existing.authorId) {
      return NextResponse.json({ error: "无权删除此文章" }, { status: 403 });
    }

    const success = await deleteArticle(id);
    if (!success) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    return NextResponse.json({ message: "删除成功" });
  } catch {
    return NextResponse.json({ error: "删除文章失败" }, { status: 500 });
  }
}
