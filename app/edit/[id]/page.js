"use client";
// 客户端组件：编辑文章的多步骤表单

// ============================================================
// 文件作用：编辑文章页面
// 访问地址：http://localhost:3000/edit/[id]
// 功能对应：修改已有文章的内容和设置（与发布页类似的两步流程）
// 如果编辑保存失败 / 加载不到文章数据，检查这个文件
// ============================================================

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ArticleEditor from "@/components/ArticleEditor";
import ArticleSettings from "@/components/ArticleSettings";

/**
 * EditPage - 编辑文章页面
 * 流程与发布页相同，但会先加载已有文章数据填充表单
 */
export default function EditPage() {
  const router = useRouter();
  // useParams 获取 URL 中的动态参数（如 /edit/abc123 中的 abc123）
  const params = useParams();
  const articleId = params.id;

  // 当前步骤
  const [step, setStep] = useState(1);
  // 文章数据（从 API 加载）
  const [existingArticle, setExistingArticle] = useState(null);
  // 编辑中的文章数据
  const [articleData, setArticleData] = useState(null);
  // 加载状态
  const [loading, setLoading] = useState(true);

  /**
   * useEffect：组件加载后自动执行
   * 类似 Java 的 @PostConstruct 或 init() 方法
   * 第二个参数 [articleId] 表示只有 articleId 变化时才重新执行
   */
  useEffect(() => {
    // 定义异步函数加载文章数据
    async function loadArticle() {
      try {
        // 调用 GET API 获取文章详情
        const response = await fetch(`/api/articles/${articleId}`);
        if (response.ok) {
          const data = await response.json();
          setExistingArticle(data);
        } else {
          // 文章不存在，跳转首页
          alert("文章不存在");
          router.push("/");
        }
      } catch (error) {
        alert("加载文章失败");
        router.push("/");
      } finally {
        // 无论成功失败，都结束加载状态
        setLoading(false);
      }
    }
    loadArticle();
  }, [articleId, router]);

  /**
   * 第一步完成：进入设置页
   */
  function handleEditorNext(data) {
    setArticleData(data);
    setStep(2);
  }

  /**
   * 保存修改：调用 PUT API 更新文章
   */
  async function handlePublish(fullArticle) {
    const response = await fetch(`/api/articles/${articleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullArticle),
    });

    if (response.ok) {
      // 保存成功，跳转到文章详情页
      router.push(`/article/${articleId}`);
    } else {
      const error = await response.json();
      alert("保存失败：" + (error.error || "未知错误"));
    }
  }

  /**
   * 返回第一步
   */
  function handleBack() {
    setStep(1);
  }

  // 加载中显示提示
  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p className="empty-state-text">加载中...</p>
        </div>
      </div>
    );
  }

  // 文章数据还没加载完
  if (!existingArticle) {
    return null;
  }

  return (
    <div className="page-container">
      {/* 步骤指示器 */}
      <div className="step-indicator">
        <div className={`step-item ${step >= 1 ? "active" : ""}`}>
          <span className="step-number">1</span>
          <span>编辑内容</span>
        </div>
        <div className="step-divider"></div>
        <div className={`step-item ${step >= 2 ? "active" : ""}`}>
          <span className="step-number">2</span>
          <span>编辑设置</span>
        </div>
      </div>

      {step === 1 ? (
        // 第 1 步：编辑器（填充已有数据）
        <ArticleEditor
          initialTitle={articleData?.title ?? existingArticle.title}
          initialContent={articleData?.content ?? existingArticle.content}
          onNext={handleEditorNext}
          submitLabel="下一步"
        />
      ) : (
        // 第 2 步：设置表单（填充已有设置）
        <ArticleSettings
          articleData={articleData}
          initialSettings={{
            summary: existingArticle.summary,
            tags: existingArticle.tags,
            thumbnailUrl: existingArticle.thumbnailUrl,
            category: existingArticle.category,
            articleType: existingArticle.articleType,
            visibility: existingArticle.visibility,
          }}
          onBack={handleBack}
          onPublish={handlePublish}
          isEditing={true}
        />
      )}
    </div>
  );
}
