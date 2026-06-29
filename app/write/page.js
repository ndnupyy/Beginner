"use client";
// 客户端组件：发布文章页面

// ============================================================
// 文件作用：发布文章页面
// 访问地址：http://localhost:3000/write
// 功能对应：单页表单 —— 编辑内容和发布设置在同一页面，滚动切换
// 如果发布流程出问题，检查这个文件
// ============================================================

import { useRouter } from "next/navigation";
import ArticleForm from "@/components/ArticleForm";
import BackToHome from "@/components/BackToHome";

/**
 * WritePage - 发布文章页面
 * 编辑内容和发布设置在同一页面，向下滚动即可切换
 */
export default function WritePage() {
  const router = useRouter();

  /**
   * 发布文章：调用 POST API 创建文章
   * @param {Object} fullArticle - 完整的文章数据
   */
  async function handleSubmit(fullArticle) {
    const response = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullArticle),
    });

    if (response.ok) {
      const newArticle = await response.json();
      router.push(`/article/${newArticle.id}`);
    } else {
      const error = await response.json();
      alert("发布失败：" + (error.error || "未知错误"));
    }
  }

  return (
    <div className="page-container">
      <BackToHome />
      <h1 className="page-title">写文章</h1>
      <ArticleForm onSubmit={handleSubmit} />
    </div>
  );
}
