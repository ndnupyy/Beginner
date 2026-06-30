"use client";
// ============================================================
// 文件作用：个人主页界面（自己 / 他人两种视图）
// 功能对应：/user/[id] — 自己可编辑删除文章，他人仅浏览
// 维护指引：
//   - 样式 → UserProfilePanel.css
//   - 数据 → lib/profile.js
// ============================================================

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCount, formatViews } from "@/lib/format";
import FollowButton from "@/components/FollowButton";
import "./UserProfilePanel.css";
import "./FollowButton.css";

function formatJoinDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("zh-CN");
}

function ProfileArticleRow({ article, isSelf, onDeleted }) {
  const router = useRouter();

  async function handleDelete() {
    const confirmed = confirm("确定要删除这篇文章吗？此操作不可恢复。");
    if (!confirmed) return;

    const response = await fetch(`/api/articles/${article.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      alert(data.error || "删除失败");
      return;
    }

    onDeleted(article.id);
    router.refresh();
  }

  const updatedLabel = new Date(
    article.updatedAt || article.createdAt
  ).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="profile-article-row">
      <div className="profile-article-main">
        {article.thumbnailUrl && (
          <Link href={`/article/${article.id}`} className="profile-article-thumb-wrap">
            <img
              src={article.thumbnailUrl}
              alt={article.title}
              className="profile-article-thumb"
            />
          </Link>
        )}
        <div className="profile-article-text">
          <div className="profile-article-title-row">
            <Link href={`/article/${article.id}`} className="profile-article-title">
              {article.title || "无标题"}
            </Link>
            {article.status === "draft" && (
              <span className="profile-article-badge">草稿</span>
            )}
            {article.articleType === "原创" && article.status !== "draft" && (
              <span className="profile-article-badge profile-article-badge-original">
                原创
              </span>
            )}
          </div>
          <p className="profile-article-summary">
            {article.summary || "暂无摘要"}
          </p>
          <div className="profile-article-meta">
            <span>更新于 {updatedLabel}</span>
            {article.status !== "draft" && (
              <>
                <span>👁 {formatViews(article.views)}</span>
                <span>👍 {formatCount(article.likes)}</span>
                <span>⭐ {formatCount(article.favorites)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {isSelf && (
        <div className="profile-article-actions">
          <Link href={`/edit/${article.id}`} className="profile-article-btn profile-article-btn-edit">
            编辑
          </Link>
          <button
            type="button"
            className="profile-article-btn profile-article-btn-delete"
            onClick={handleDelete}
          >
            删除
          </button>
        </div>
      )}
    </article>
  );
}

export default function UserProfilePanel({ initialProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [activeTab, setActiveTab] = useState("articles");
  const [fansCount, setFansCount] = useState(profile.stats.fansCount);

  const displayArticles = useMemo(() => {
    if (activeTab === "drafts" && profile.isSelf) {
      return profile.draftArticles;
    }
    return profile.publishedArticles;
  }, [activeTab, profile]);

  function handleArticleDeleted(articleId) {
    setProfile((current) => ({
      ...current,
      publishedArticles: current.publishedArticles.filter(
        (item) => item.id !== articleId
      ),
      draftArticles: current.draftArticles.filter((item) => item.id !== articleId),
      stats: {
        ...current.stats,
        articleCount: current.publishedArticles.filter(
          (item) => item.id !== articleId
        ).length,
      },
    }));
  }

  const { stats } = profile;

  return (
    <div className="user-profile">
      <section className="profile-header-card">
        <div className="profile-header-main">
          <img
            src={profile.avatarUrl || "/default-avatar.svg"}
            alt={profile.username}
            className="profile-header-avatar"
          />
          <div className="profile-header-info">
            <h1 className="profile-header-name">{profile.username}</h1>
            <div className="profile-header-badges">
              <span className="profile-header-badge">码龄 {profile.codeAgeYears} 年</span>
              <span className="profile-header-badge">博客等级 Lv.{profile.blogLevel}</span>
            </div>
            <div className="profile-header-stats">
              <span><strong>{formatCount(stats.totalViews)}</strong> 总访问量</span>
              <span><strong>{stats.articleCount}</strong> 原创</span>
              <span><strong>{formatCount(stats.fansCount)}</strong> 粉丝</span>
              <span><strong>{formatCount(stats.followingCount)}</strong> 关注</span>
            </div>
            <p className="profile-header-meta">
              加入时间 {formatJoinDate(profile.createdAt)}
              {profile.isQualityCreator && (
                <> · 优质创作者：{profile.creatorField}</>
              )}
            </p>
          </div>
        </div>

        <div className="profile-header-actions">
          {profile.isSelf ? (
            <>
              <Link href="/write" className="profile-header-btn profile-header-btn-primary">
                去创作
              </Link>
              <span className="profile-header-hint">在此管理你的博文</span>
            </>
          ) : profile.canFollow ? (
            <FollowButton
              userId={profile.userId}
              initialFollowing={profile.isFollowing}
              initialFansCount={stats.fansCount}
              onFansCountChange={setFansCount}
            />
          ) : profile.requireLogin ? (
            <Link href="/login" className="profile-header-btn">
              登录后关注
            </Link>
          ) : null}
        </div>
      </section>

      <div className="profile-body">
        <aside className="profile-sidebar">
          <div className="profile-sidebar-card">
            <h2 className="profile-sidebar-title">个人成就</h2>
            <ul className="profile-achievement-list">
              <li><span>获得点赞</span><strong>{formatCount(stats.totalLikes)}</strong></li>
              <li><span>被收藏</span><strong>{formatCount(stats.totalFavorites)}</strong></li>
              <li><span>原创文章</span><strong>{stats.originalCount}</strong></li>
              <li><span>粉丝</span><strong>{formatCount(fansCount)}</strong></li>
            </ul>
          </div>

          {profile.categories.length > 0 && (
            <div className="profile-sidebar-card">
              <h2 className="profile-sidebar-title">TA 的专栏</h2>
              <ul className="profile-category-list">
                {profile.categories.map((item) => (
                  <li key={item.name}>
                    <span>{item.name}</span>
                    <span>{item.count} 篇</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <section className="profile-content">
          <div className="profile-tabs">
            <button
              type="button"
              className={`profile-tab${activeTab === "articles" ? " profile-tab-active" : ""}`}
              onClick={() => setActiveTab("articles")}
            >
              文章 ({profile.publishedArticles.length})
            </button>
            {profile.isSelf && (
              <button
                type="button"
                className={`profile-tab${activeTab === "drafts" ? " profile-tab-active" : ""}`}
                onClick={() => setActiveTab("drafts")}
              >
                草稿 ({profile.draftArticles.length})
              </button>
            )}
          </div>

          {displayArticles.length > 0 ? (
            <div className="profile-article-list">
              {displayArticles.map((article) => (
                <ProfileArticleRow
                  key={article.id}
                  article={article}
                  isSelf={profile.isSelf}
                  onDeleted={handleArticleDeleted}
                />
              ))}
            </div>
          ) : (
            <div className="profile-empty">
              {profile.isSelf ? (
                activeTab === "drafts" ? (
                  <p>还没有草稿</p>
                ) : (
                  <>
                    <p>还没有发布文章</p>
                    <Link href="/write" className="profile-empty-link">去创作</Link>
                  </>
                )
              ) : (
                <p>TA 还没有发布文章</p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
