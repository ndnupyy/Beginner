"use client";
// 客户端组件：包含多步骤表单和 API 调用

// ============================================================
// 文件作用：发布文章页面（对应图二 + 图三）
// 访问地址：http://localhost:3000/write
// 功能对应：两步发布流程 —— 第一步写内容，第二步设置并发布
// 如果发布流程出问题，检查这个文件
// ============================================================

import { useState } from "react";
// 引入 Next.js 路由 Hook，用于页面跳转
import { useRouter } from "next/navigation";
// 引入第一步编辑器组件（图二）
import ArticleEditor from "@/components/ArticleEditor";
// 引入第二步设置表单组件（图三）
import ArticleSettings from "@/components/ArticleSettings";

/**
 * WritePage - 发布文章页面
 * 分两步：
 *   第 1 步（step=1）：输入标题和正文（图二）
 *   第 2 步（step=2）：设置标签、封面、摘要等并发布（图三）
 */
export default function WritePage() {
  // useRouter 用于编程式导航（类似 Java 的 response.sendRedirect）
  const router = useRouter();

  // 当前步骤：1 = 编辑内容，2 = 发布设置
  const [step, setStep] = useState(1);
  // 第一步收集的文章数据（标题 + 内容）
  const [articleData, setArticleData] = useState(null);

  /**
   * 第一步完成回调：编辑器点击"下一步"时触发
   * @param {Object} data - { title, content }
   */
  function handleEditorNext(data) {
    // 保存标题和内容
    setArticleData(data);
    // 进入第二步
    setStep(2);
  }

  /**
   * 第二步发布回调：设置表单点击"发布文章"时触发
   * @param {Object} fullArticle - 完整的文章数据
   */
  async function handlePublish(fullArticle) {
    // 调用后端 API 创建文章
    // fetch 是浏览器内置的 HTTP 请求函数（类似 Java 的 HttpClient）
    const response = await fetch("/api/articles", {
      method: "POST",                              // HTTP 方法：POST 表示创建
      headers: { "Content-Type": "application/json" }, // 告诉服务器发送的是 JSON
      body: JSON.stringify(fullArticle),           // 把 JS 对象转为 JSON 字符串
    });

    // 如果请求成功（状态码 200~299）
    if (response.ok) {
      // 解析返回的文章数据，获取新文章的 ID
      const newArticle = await response.json();
      // 跳转到新文章的详情页
      router.push(`/article/${newArticle.id}`);
    } else {
      // 请求失败，解析错误信息并弹窗提示
      const error = await response.json();
      alert("发布失败：" + (error.error || "未知错误"));
    }
  }

  /**
   * 从第二步返回第一步
   */
  function handleBack() {
    setStep(1);
  }

  return (
    <div className="page-container">
      {/* ===== 步骤指示器 ===== */}
      <div className="step-indicator">
        {/* 第 1 步 */}
        <div className={`step-item ${step >= 1 ? "active" : ""}`}>
          <span className="step-number">1</span>
          <span>编辑内容</span>
        </div>
        {/* 步骤之间的分隔线 */}
        <div className="step-divider"></div>
        {/* 第 2 步 */}
        <div className={`step-item ${step >= 2 ? "active" : ""}`}>
          <span className="step-number">2</span>
          <span>发布设置</span>
        </div>
      </div>

      {/* ===== 根据当前步骤显示不同组件 ===== */}
      {step === 1 ? (
        // 第 1 步：文章编辑器（图二）
        <ArticleEditor
          // 如果是从第 2 步返回，恢复之前输入的内容
          initialTitle={articleData?.title || ""}
          initialContent={articleData?.content || ""}
          onNext={handleEditorNext}
        />
      ) : (
        // 第 2 步：发布设置（图三）
        <ArticleSettings
          articleData={articleData}
          onBack={handleBack}
          onPublish={handlePublish}
        />
      )}
    </div>
  );
}
