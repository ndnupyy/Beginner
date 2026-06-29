// ============================================================
// 文件作用：文章 API 路由 - 处理「获取列表」和「创建文章」
// 访问地址：GET  /api/articles      → 获取所有文章
//           POST /api/articles      → 创建新文章
// 功能对应：首页加载文章列表、发布文章时的保存操作
// 如果首页不显示文章 / 发布失败，检查这个文件
// ============================================================

// 从 lib/articles.js 导入数据操作函数
import {
  getAllArticles,
  createArticle,
} from "@/lib/articles";
// NextResponse 用于返回 JSON 格式的 HTTP 响应（类似 Spring Boot 的 ResponseEntity）
import { NextResponse } from "next/server";

/**
 * GET 请求处理函数 - 获取所有文章（Read - 查列表）
 * 当浏览器或前端代码请求 GET /api/articles 时，Next.js 会自动调用此函数
 */
export async function GET() {
  try {
    // 从 JSON 文件读取所有文章
    const articles = getAllArticles();
    // 返回 JSON 响应，status 200 表示成功（类似 HTTP 200 OK）
    return NextResponse.json(articles);
  } catch (error) {
    // 如果读取出错，返回 500 错误和错误信息
    return NextResponse.json(
      { error: "获取文章列表失败" },
      { status: 500 }
    );
  }
}

/**
 * POST 请求处理函数 - 创建新文章（Create - 增）
 * 当发布文章页面提交表单时，前端会发送 POST /api/articles
 */
export async function POST(request) {
  try {
    // 从请求体中解析 JSON 数据（前端 send 过来的文章信息）
    const body = await request.json();
    // 校验标题：至少 5 个字（与图二的要求一致）
    if (!body.title || body.title.length < 5) {
      return NextResponse.json(
        { error: "标题至少需要 5 个字" },
        { status: 400 }
      );
    }
    // 校验正文：不能为空
    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json(
        { error: "文章内容不能为空" },
        { status: 400 }
      );
    }
    // 调用 createArticle 保存到 JSON 文件
    const newArticle = createArticle(body);
    // 返回 201 Created 和新文章数据
    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "创建文章失败" },
      { status: 500 }
    );
  }
}
