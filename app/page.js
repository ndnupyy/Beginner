// ============================================================
// 文件作用：首页（文章列表页，对应图一）
// 访问地址：http://localhost:3000/
// 功能对应：展示所有文章的卡片列表
// 如果首页不显示文章 / 布局不对，检查这个文件
// ============================================================

// 从 lib/articles.js 直接读取文章数据（服务端读取，不需要 API）
import { getAllArticles } from "@/lib/articles";
// 引入文章卡片组件
import PostCard from "@/components/PostCard";
// 引入 Next.js 的 Link 组件
import Link from "next/link";

/**
 * Home 页面组件 - 首页
 * 这是一个"服务端组件"（默认），在服务器上运行
 * 可以直接读取文件，不需要 "use client"
 */
export default function Home() {
  // 从 JSON 文件获取所有文章（已按时间倒序排列）
  const articles = getAllArticles();

  return (
    // 页面容器
    <div className="page-container">
      {/* 页面标题 */}
      <h1 className="page-title">最新文章</h1>

      {/* 判断：有文章就显示列表，没有就显示空状态提示 */}
      {articles.length > 0 ? (
        // 文章列表：遍历 articles 数组，每篇文章渲染一个 PostCard
        <div className="article-list">
          {articles.map((article) => (
            // key={article.id} 是 React 的要求，帮助 React 识别每个列表项
            // 类似 Java 中 List 遍历时每个元素的唯一标识
            <PostCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        // 空状态：还没有文章时的提示
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <p className="empty-state-text">还没有文章，快来写第一篇吧！</p>
          {/* 点击跳转到写文章页面 */}
          <Link href="/write" className="empty-state-link">
            去写文章
          </Link>
        </div>
      )}
    </div>
  );
}
