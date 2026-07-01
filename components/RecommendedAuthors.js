"use client";
// ============================================================
// 文件作用：右侧作者推荐列表
// 功能对应：/following 页右侧栏
// ============================================================

import { useState } from "react";
import FollowButton from "@/components/FollowButton";
import "./RecommendedAuthors.css";

export default function RecommendedAuthors({ authors: initialAuthors = [] }) {
  const [authors, setAuthors] = useState(initialAuthors);

  function handleFollowingChange(userId, following) {
    if (following) {
      setAuthors((current) =>
        current.filter((author) => author.userId !== userId)
      );
    }
  }

  return (
    <aside className="recommended-authors" aria-label="作者推荐">
      <h2 className="recommended-authors-title">作者推荐</h2>

      {authors.length === 0 ? (
        <p className="recommended-authors-empty">暂无更多推荐作者</p>
      ) : (
        <ul className="recommended-authors-list">
          {authors.map((author) => (
            <li key={author.userId} className="recommended-authors-item">
              <img
                src={author.avatarUrl || "/default-avatar.svg"}
                alt={author.username}
                className="recommended-authors-avatar"
              />
              <div className="recommended-authors-info">
                <div className="recommended-authors-name">{author.username}</div>
                <div className="recommended-authors-tagline">{author.tagline}</div>
              </div>
              <FollowButton
                userId={author.userId}
                initialFollowing={author.isFollowing}
                size="sidebar"
                onFollowingChange={(following) =>
                  handleFollowingChange(author.userId, following)
                }
              />
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
