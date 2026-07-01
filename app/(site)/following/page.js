// ============================================================
// 文件作用：关注页（CSDN 风格灰底 + 白卡片信息流 + 作者推荐）
// 访问地址：http://localhost:3000/following
// 维护指引：
//   - 布局样式 → components/FollowingPage.css
//   - 动态卡片 → components/FollowingFeedCard.js
//   - 作者推荐 → components/RecommendedAuthors.js
// ============================================================

import Link from "next/link";
import { getFollowingFeed, getRecommendedAuthors } from "@/lib/follows";
import { getSessionUserId } from "@/lib/session";
import FollowingFeedCard from "@/components/FollowingFeedCard";
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
    <div className="page-container following-page">
      <div className="following-layout">
        <section className="following-main" aria-label="关注动态">
          {feed.length > 0 ? (
            <div className="following-feed-list">
              {feed.map((article) => (
                <FollowingFeedCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="following-empty-panel">
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
        </section>

        <RecommendedAuthors authors={recommended} />
      </div>
    </div>
  );
}
