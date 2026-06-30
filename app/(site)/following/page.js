// ============================================================
// 文件作用：关注页（关注作者的最新文章 + 作者推荐）
// 访问地址：http://localhost:3000/following
// ============================================================

import Link from "next/link";
import { getFollowingFeed, getRecommendedAuthors } from "@/lib/follows";
import { getSessionUserId } from "@/lib/session";
import PostCard from "@/components/PostCard";
import RecommendedAuthors from "@/components/RecommendedAuthors";
import "@/components/FollowingPage.css";

export default async function FollowingPage() {
  const userId = await getSessionUserId();
  const [feed, recommended] = userId
    ? await Promise.all([
        getFollowingFeed(userId),
        getRecommendedAuthors(userId),
      ])
    : [[], []];

  return (
    <div className="following-page">
      {/* 左侧固定宽展示框：与首页 page-container 同宽，PostCard 样式一致 */}
      <div className="page-container following-main">
        <h1 className="page-title">关注</h1>

        {feed.length > 0 ? (
          <div className="article-list">
            {feed.map((article) => (
              <PostCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="following-empty">
            <p className="following-empty-text">
              {userId
                ? "还没有关注任何作者，或关注的作者暂无新文章"
                : "登录后即可查看关注动态"}
            </p>
            <p className="following-empty-hint">
              {userId ? (
                <>在文章详情页点击「关注」，或从右侧推荐作者开始关注</>
              ) : (
                <Link href="/login">去登录</Link>
              )}
            </p>
          </div>
        )}
      </div>

      {/* 右侧：作者推荐，紧贴展示框右侧 */}
      <RecommendedAuthors authors={recommended} />
    </div>
  );
}
