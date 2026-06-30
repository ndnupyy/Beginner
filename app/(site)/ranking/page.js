// ============================================================
// 文件作用：阅读排行榜页
// 访问地址：http://localhost:3000/ranking
// 功能对应：展示阅读量前 10 的文章
// 维护指引：
//   - 排序逻辑 → lib/articles.js getTopArticlesByViews
//   - 样式 → ranking.css
// ============================================================

import Link from "next/link";
import { getTopArticlesByViews } from "@/lib/articles";
import PostCard from "@/components/PostCard";
import BackToHome from "@/components/BackToHome";
import "./ranking.css";

export default async function RankingPage() {
  const articles = await getTopArticlesByViews(10);

  return (
    <div className="page-container">
      <BackToHome />

      <div className="page-header-row">
        <h1 className="page-title">阅读排行榜</h1>
      </div>
      <p className="ranking-desc">按阅读量排序的前 10 篇文章</p>

      {articles.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">还没有文章，无法生成排行榜</p>
          <Link href="/write" className="empty-state-link">
            去写文章
          </Link>
        </div>
      ) : (
        <div className="ranking-list">
          {articles.map((article, index) => (
            <div key={article.id} className="ranking-item">
              <span
                className={`ranking-rank${
                  index < 3 ? " ranking-rank-top" : ""
                }`}
              >
                {index + 1}
              </span>
              <PostCard article={article} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
