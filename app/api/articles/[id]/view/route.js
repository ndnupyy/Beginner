// ============================================================
// 文件作用：文章阅读量 +1（客户端单次调用）
// 访问地址：POST /api/articles/[id]/view
// ============================================================

import { NextResponse } from "next/server";
import { incrementViews } from "@/lib/articles";

export async function POST(_request, { params }) {
  try {
    const { id } = await params;
    const article = await incrementViews(id);

    if (!article) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    return NextResponse.json({ views: article.views });
  } catch {
    return NextResponse.json({ error: "更新阅读量失败" }, { status: 500 });
  }
}
