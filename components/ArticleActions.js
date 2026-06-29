"use client";
// 客户端组件：包含删除按钮的交互逻辑

// ============================================================
// 文件作用：文章详情页的操作按钮（编辑 + 删除）
// 功能对应：文章详情页底部的"编辑"和"删除"按钮
// 如果删除/编辑按钮无效，检查这个文件
// ============================================================

import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * ArticleActions 组件 - 文章操作按钮
 * @param {Object} props
 *   props.articleId - 当前文章的 ID
 */
export default function ArticleActions({ articleId }) {
  const router = useRouter();

  /**
   * 处理删除按钮点击
   */
  async function handleDelete() {
    // confirm 弹出确认对话框，防止误删
    const confirmed = confirm("确定要删除这篇文章吗？此操作不可恢复。");
    if (!confirmed) return;

    // 调用 DELETE API 删除文章
    const response = await fetch(`/api/articles/${articleId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      // 删除成功，跳转回首页
      router.push("/");
    } else {
      const error = await response.json();
      alert("删除失败：" + (error.error || "未知错误"));
    }
  }

  return (
    <div className="article-detail-actions">
      {/* 编辑按钮：跳转到编辑页面 */}
      <Link href={`/edit/${articleId}`} className="btn-edit">
        编辑文章
      </Link>
      {/* 删除按钮 */}
      <button className="btn-delete" onClick={handleDelete}>
        删除文章
      </button>
    </div>
  );
}
