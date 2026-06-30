// ============================================================
// 文件作用：文章正文图片上传 API
// 访问地址：POST /api/articles/upload-image
// 功能对应：编辑器工具栏「图片」本地上传
// ============================================================

import { NextResponse } from "next/server";
import { saveArticleImageFromFormData } from "@/lib/articleImages";
import { getSessionUserId } from "@/lib/session";

export async function POST(request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("image");
    const imageUrl = await saveArticleImageFromFormData(file);

    return NextResponse.json({ imageUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "图片上传失败" },
      { status: 400 }
    );
  }
}
