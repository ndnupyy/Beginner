// ============================================================
// 文件作用：首页（文章列表页，对应图一）
// 访问地址：http://localhost:3000/
// 功能对应：展示所有文章的卡片列表 + 分类专栏 + 标题搜索 + 分页（每页 10 篇）
// 如果首页不显示文章 / 搜索不对，检查这个文件和 ArticleSearchList.js
// ============================================================

// 从 lib/articles.js 直接读取文章数据（服务端读取，不需要 API）
import { getAllArticles } from "@/lib/articles";
import ArticleSearchList from "@/components/ArticleSearchList";
import RankingLink from "@/components/RankingLink";

/**
 * Home 页面组件 - 首页
 * 这是一个"服务端组件"（默认），在服务器上运行
 * 负责从数据库读取文章，再交给客户端组件做搜索过滤
 */
export default async function Home() {
  const articles = await getAllArticles();

  return (
    <div className="page-container">
      <div className="page-header-row">
        <h1 className="page-title">最新文章</h1>
        <RankingLink />
      </div>

      <ArticleSearchList articles={articles} />
    </div>
  );
}
