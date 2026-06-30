"use client";
// ============================================================
// 文件作用：发布文章页面
// 访问地址：http://localhost:3000/write
// ============================================================

import Link from "next/link";
import { useRouter } from "next/navigation";
import ArticleForm from "@/components/ArticleForm";
import WriteAiAssistant from "@/components/WriteAiAssistant";
import "@/components/WritePage.css";

export default function WritePage() {
  const router = useRouter();

  async function handleSubmit(fullArticle) {
    const response = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullArticle),
    });

    if (response.ok) {
      router.push("/");
      router.refresh();
    } else {
      const error = await response.json();
      alert("发布失败：" + (error.error || "未知错误"));
    }
  }

  async function handleSaveDraft(fullArticle) {
    const response = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fullArticle, status: "draft" }),
    });

    if (response.ok) {
      const article = await response.json();
      alert("草稿已保存");
      router.push(`/edit/${article.id}`);
      router.refresh();
    } else {
      const error = await response.json();
      alert("保存草稿失败：" + (error.error || "未知错误"));
    }
  }

  return (
    <div className="write-page">
      <div className="write-page-inner">
        <div className="write-page-main">
          <div className="write-page-header">
            <h1 className="write-page-title">发布文章</h1>
            <Link href="/" className="write-page-back">
              ← 返回首页
            </Link>
          </div>
          <ArticleForm onSubmit={handleSubmit} onSaveDraft={handleSaveDraft} />
        </div>
        <WriteAiAssistant />
      </div>
    </div>
  );
}
