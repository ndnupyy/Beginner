// ============================================================
// 文件作用：首页（文章列表页，对应图一）
// 访问地址：http://localhost:3000/
// 功能对应：资讯头条轮播 + 文章列表 + 分类专栏 + 分页
// 如果首页不显示文章 / 轮播不对，检查 HomeHeadlineCarousel.js、ArticleSearchList.js
// ============================================================

import { getAllArticles } from "@/lib/articles";
import { getHeadlineCarouselArticles } from "@/lib/homeHeadlines";
import HomeHeadlineCarousel from "@/components/HomeHeadlineCarousel";
import ArticleSearchList from "@/components/ArticleSearchList";
import RankingLink from "@/components/RankingLink";
import "./home-page.css";

/**
 * Home 页面组件 - 首页
 * 这是一个"服务端组件"（默认），在服务器上运行
 * 负责从数据库读取文章，再交给客户端组件做搜索过滤
 */
export default async function Home() {
  const articles = await getAllArticles();
  const headlineItems = getHeadlineCarouselArticles(articles);

  return (
    <div className="page-container home-page">
      <HomeHeadlineCarousel items={headlineItems} />

      <div className="home-feed-panel">
        <div className="home-feed-toolbar">
          <RankingLink />
        </div>
        <ArticleSearchList articles={articles} />
      </div>
    </div>
  );
}
