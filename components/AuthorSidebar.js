"use client";
// ============================================================
// 文件作用：文章详情页左侧作者信息栏（替换主导航 Sidebar）
// 功能对应：展示作者头像、等级、统计数据、关注/私信按钮（UI）
// 维护指引：
//   - 样式 → AuthorSidebar.css
//   - 数据 → GET /api/articles/[id]/author
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatStatCount } from "@/lib/format";
import "./AuthorSidebar.css";

export default function AuthorSidebar({ articleId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      try {
        const response = await fetch(`/api/articles/${articleId}/author`);
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) setProfile(data.profile);
      } catch {
        // 保持空态
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  if (loading) {
    return (
      <aside className="author-sidebar" aria-label="作者信息">
        <div className="author-sidebar-card author-sidebar-loading">加载中...</div>
      </aside>
    );
  }

  if (!profile) {
    return (
      <aside className="author-sidebar" aria-label="作者信息">
        <div className="author-sidebar-card">
          <Link href="/" className="author-sidebar-back">
            ← 返回首页
          </Link>
        </div>
      </aside>
    );
  }

  const { stats } = profile;

  return (
    <aside className="author-sidebar" aria-label="作者信息">
      <div className="author-sidebar-card">
        <Link href="/" className="author-sidebar-back">
          ← 返回首页
        </Link>

        <div className="author-sidebar-header">
          <img
            src={profile.avatarUrl || "/default-avatar.svg"}
            alt={profile.username}
            className="author-sidebar-avatar"
          />
          <div className="author-sidebar-name">{profile.username}</div>
          <div className="author-sidebar-badges">
            <span className="author-sidebar-badge">
              博客等级 Lv.{profile.blogLevel}
            </span>
            <span className="author-sidebar-badge">
              码龄 {profile.codeAgeYears}年
            </span>
          </div>
        </div>

        {profile.isQualityCreator && (
          <div className="author-sidebar-creator">
            <span className="author-sidebar-creator-icon">🏅</span>
            <span>
              优质创作者：
              <strong>{profile.creatorField}</strong>
              领域
            </span>
          </div>
        )}

        <div className="author-sidebar-stats">
          <div className="author-sidebar-stat">
            <strong>{formatStatCount(stats.originalCount)}</strong>
            <span>原创</span>
          </div>
          <div className="author-sidebar-stat">
            <strong>{formatStatCount(stats.totalLikes)}</strong>
            <span>点赞</span>
          </div>
          <div className="author-sidebar-stat">
            <strong>{formatStatCount(stats.totalFavorites)}</strong>
            <span>收藏</span>
          </div>
          <div className="author-sidebar-stat">
            <strong>{formatStatCount(stats.fansCount)}</strong>
            <span>粉丝</span>
          </div>
        </div>

        <div className="author-sidebar-actions">
          <button
            type="button"
            className="author-sidebar-btn author-sidebar-btn-primary"
            onClick={() => alert("关注功能开发中")}
          >
            关注
          </button>
          <button
            type="button"
            className="author-sidebar-btn author-sidebar-btn-secondary"
            onClick={() => alert("私信功能开发中")}
          >
            私信
          </button>
        </div>
      </div>
    </aside>
  );
}
