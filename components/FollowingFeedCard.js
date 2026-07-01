// ============================================================
// 文件作用：关注页动态卡片（CSDN 风格单条信息流）
// 功能对应：/following 页左侧关注作者文章列表
// 维护指引：
//   - 卡片样式 → FollowingFeedCard.css
//   - 跳转动画 → components/ArticleLink.js
// ============================================================

import ArticleLink from "@/components/ArticleLink";
import { formatCount, formatRelativeTime } from "@/lib/format";
import "./FollowingFeedCard.css";

/**
 * FollowingFeedCard - 关注流单条文章卡片
 * @param {Object} props
 * @param {Object} props.article - 文章数据
 */
export default function FollowingFeedCard({ article }) {
  const {
    id,
    title,
    summary,
    authorName,
    authorAvatar,
    thumbnailUrl,
    likes = 0,
    createdAt,
  } = article;

  return (
    <ArticleLink href={`/article/${id}`} className="following-feed-card">
      <div className="following-feed-card-author">
        <img
          src={authorAvatar || "/default-avatar.svg"}
          alt={authorName}
          className="following-feed-card-avatar"
        />
        <span className="following-feed-card-username">{authorName}</span>
        <span className="following-feed-card-action">发布了博客</span>
        <span className="following-feed-card-time">
          {formatRelativeTime(createdAt)}
        </span>
      </div>

      <div className="following-feed-card-body">
        <div className="following-feed-card-text">
          <h2 className="following-feed-card-title">{title}</h2>
          <p className="following-feed-card-summary">
            {summary || "暂无摘要"}
          </p>
          <div className="following-feed-card-meta">
            <span className="following-feed-card-meta-item">
              <svg
                className="following-feed-card-meta-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M7 11v8" />
                <path d="M11.2 11H16l-1.1 4.5a2 2 0 0 1-1.9 1.5H9.8L11.2 11Z" />
                <path d="M7 11V7.8A1.8 1.8 0 0 1 8.8 6H11" />
              </svg>
              {formatCount(likes)}
            </span>
            <span className="following-feed-card-meta-item">
              <svg
                className="following-feed-card-meta-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M4 6.5h16v9H8.2L4 19.5V6.5Z" />
              </svg>
              评论
            </span>
          </div>
        </div>

        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="following-feed-card-thumb"
          />
        ) : null}
      </div>
    </ArticleLink>
  );
}
