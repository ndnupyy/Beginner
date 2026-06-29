"use client";
// 客户端组件：编辑文章页面

// ============================================================
// 文件作用：编辑文章页面
// 访问地址：http://localhost:3000/edit/[id]
// 功能对应：单页表单 —— 编辑内容和发布设置在同一页面，滚动切换
// 如果编辑保存失败 / 加载不到文章数据，检查这个文件
// ============================================================

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ArticleForm from "@/components/ArticleForm";
import BackToHome from "@/components/BackToHome";

/**
 * EditPage - 编辑文章页面
 * 先加载已有文章数据，然后在同一页面编辑内容和设置
 */
export default function EditPage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id;

  // 从 API 加载的已有文章数据
  const [existingArticle, setExistingArticle] = useState(null);
  // 加载状态
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArticle() {
      try {
        const response = await fetch(`/api/articles/${articleId}`);
        if (response.ok) {
          const data = await response.json();
          setExistingArticle(data);
        } else {
          alert("文章不存在");
          router.push("/");
        }
      } catch (error) {
        alert("加载文章失败");
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    loadArticle();
  }, [articleId, router]);

  /**
   * 保存修改：调用 PUT API 更新文章
   */
  async function handleSubmit(fullArticle) {
    const response = await fetch(`/api/articles/${articleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullArticle),
    });

    if (response.ok) {
      router.push(`/article/${articleId}`);
    } else {
      const error = await response.json();
      alert("保存失败：" + (error.error || "未知错误"));
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p className="empty-state-text">加载中...</p>
        </div>
      </div>
    );
  }

  if (!existingArticle) {
    return null;
  }

  return (
    <div className="page-container">
      <BackToHome />
      <h1 className="page-title">编辑文章</h1>
      <ArticleForm
        initialData={existingArticle}
        onSubmit={handleSubmit}
        isEditing={true}
      />
    </div>
  );
}
