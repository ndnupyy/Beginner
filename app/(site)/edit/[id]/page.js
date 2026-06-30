"use client";
// ============================================================
// 文件作用：编辑文章页面
// 访问地址：http://localhost:3000/edit/[id]
// ============================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import ArticleForm from "@/components/ArticleForm";
import "@/components/WritePage.css";

export default function EditPage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id;

  const [existingArticle, setExistingArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArticle() {
      try {
        const response = await fetch(`/api/articles/${articleId}`);
        if (response.ok) {
          const data = await response.json();
          setExistingArticle(data);
        } else {
          alert("文章不存在或无权访问");
          router.push("/");
        }
      } catch {
        alert("加载文章失败");
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    loadArticle();
  }, [articleId, router]);

  async function handleSubmit(fullArticle) {
    const response = await fetch(`/api/articles/${articleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fullArticle, status: "published" }),
    });

    if (response.ok) {
      const authorId = existingArticle?.authorId;
      router.push(authorId ? `/user/${authorId}` : "/");
      router.refresh();
    } else {
      const error = await response.json();
      alert("发布失败：" + (error.error || "未知错误"));
    }
  }

  async function handleSaveDraft(fullArticle) {
    const response = await fetch(`/api/articles/${articleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fullArticle, status: "draft" }),
    });

    if (response.ok) {
      const article = await response.json();
      setExistingArticle(article);
      alert("草稿已保存");
    } else {
      const error = await response.json();
      alert("保存草稿失败：" + (error.error || "未知错误"));
    }
  }

  if (loading) {
    return (
      <div className="write-page">
        <div className="write-page-inner">
          <div className="empty-state">
            <p className="empty-state-text">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!existingArticle) {
    return null;
  }

  const isDraft = existingArticle.status === "draft";

  return (
    <div className="write-page">
      <div className="write-page-inner">
        <div className="write-page-header">
          <h1 className="write-page-title">
            {isDraft ? "编辑草稿" : "编辑文章"}
          </h1>
          <Link href="/" className="write-page-back">
            ← 返回首页
          </Link>
        </div>
        <ArticleForm
          initialData={existingArticle}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          isEditing
          isDraft={isDraft}
        />
      </div>
    </div>
  );
}
