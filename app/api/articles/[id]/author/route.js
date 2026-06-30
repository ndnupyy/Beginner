// ============================================================
// 文件作用：文章作者资料 API
// 访问地址：GET /api/articles/[id]/author
// 维护指引：数据逻辑 → lib/authors.js
// ============================================================

import { NextResponse } from "next/server";
import { getAuthorProfileForArticle } from "@/lib/authors";

export async function GET(_request, { params }) {
  const { id } = await params;
  const profile = await getAuthorProfileForArticle(id);

  if (!profile) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}
