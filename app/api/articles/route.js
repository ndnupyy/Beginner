// ============================================================
// 文件作用：文章 API 路由 - 处理「获取列表」和「创建文章」
// 访问地址：GET  /api/articles      → 获取已发布文章
//           POST /api/articles      → 创建新文章（发布 / 草稿）
// ============================================================

import {
  getAllArticles,
  createArticle,
  ARTICLE_STATUS,
} from "@/lib/articles";
import { getSessionUserId } from "@/lib/session";
import { getUserById } from "@/lib/users";
import { NextResponse } from "next/server";

function isDraft(body) {
  return body.status === ARTICLE_STATUS.draft;
}

function validatePublished(body) {
  if (!body.title || body.title.length < 5) {
    return "标题至少需要 5 个字";
  }
  if (!body.content || body.content.trim().length === 0) {
    return "文章内容不能为空";
  }
  return null;
}

export async function GET() {
  try {
    const articles = await getAllArticles();
    return NextResponse.json(articles);
  } catch {
    return NextResponse.json(
      { error: "获取文章列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const draft = isDraft(body);

    if (!draft) {
      const error = validatePublished(body);
      if (error) {
        return NextResponse.json({ error }, { status: 400 });
      }
    }

    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 401 });
    }

    const newArticle = await createArticle({
      ...body,
      status: draft ? ARTICLE_STATUS.draft : ARTICLE_STATUS.published,
      authorId: user.id,
      authorName: user.username,
      authorAvatar: user.avatarUrl,
    });
    return NextResponse.json(newArticle, { status: 201 });
  } catch {
    return NextResponse.json({ error: "创建文章失败" }, { status: 500 });
  }
}
