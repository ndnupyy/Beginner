"use client";
// ============================================================
// 文件作用：文章详情页底部点赞 / 收藏操作栏（CSDN 风格）
// 功能对应：固定底栏 toggle 点赞与收藏
// 维护指引：
//   - 样式 → ArticleReactions.css
//   - API → app/api/articles/[id]/reactions/route.js
// ============================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCount } from "@/lib/format";
import "./ArticleReactions.css";

function LikeIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M7 11v8a1 1 0 0 0 1 1h2l1-7H7Z"
        fill={active ? "currentColor" : "none"}
      />
      <path
        d="M11 13l2.5-5.5a1.5 1.5 0 0 1 2.8.5L16 11h4.5a1 1 0 0 1 .98 1.2l-1.2 6A1 1 0 0 1 19.3 19H11"
        fill={active ? "currentColor" : "none"}
      />
    </svg>
  );
}

function FavoriteIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.8 6.7 19l1-5.8-4.2-4.1 5.9-.9L12 3Z"
        fill={active ? "currentColor" : "none"}
      />
    </svg>
  );
}

export default function ArticleReactions({
  articleId,
  initialLikes = 0,
  initialFavorites = 0,
}) {
  const router = useRouter();
  const [likes, setLikes] = useState(initialLikes);
  const [favorites, setFavorites] = useState(initialFavorites);
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [loadingType, setLoadingType] = useState("");

  useEffect(() => {
    async function loadState() {
      try {
        const response = await fetch(`/api/articles/${articleId}/reactions`);
        if (!response.ok) return;
        const data = await response.json();
        setLikes(data.likes ?? initialLikes);
        setFavorites(data.favorites ?? initialFavorites);
        setLiked(Boolean(data.liked));
        setFavorited(Boolean(data.favorited));
      } catch {
        // 保留服务端初始值
      }
    }

    loadState();
  }, [articleId, initialLikes, initialFavorites]);

  async function handleToggle(type) {
    if (loadingType) return;
    setLoadingType(type);

    try {
      const response = await fetch(`/api/articles/${articleId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "操作失败");
      }

      setLikes(data.likes);
      setFavorites(data.favorites);
      setLiked(Boolean(data.liked));
      setFavorited(Boolean(data.favorited));
      router.refresh();
    } catch (error) {
      alert(error.message || "操作失败");
    } finally {
      setLoadingType("");
    }
  }

  return (
    <div className="article-action-bar" role="toolbar" aria-label="文章互动">
      <div className="article-action-bar-inner">
        <button
          type="button"
          className={`article-action-item${
            liked ? " article-action-item-active" : ""
          }`}
          onClick={() => handleToggle("like")}
          disabled={loadingType === "like"}
          aria-pressed={liked}
        >
          <LikeIcon active={liked} />
          <span>{formatCount(likes)}</span>
        </button>

        <span className="article-action-divider" aria-hidden="true" />

        <button
          type="button"
          className={`article-action-item${
            favorited ? " article-action-item-active" : ""
          }`}
          onClick={() => handleToggle("favorite")}
          disabled={loadingType === "favorite"}
          aria-pressed={favorited}
        >
          <FavoriteIcon active={favorited} />
          <span>{formatCount(favorites)}</span>
        </button>
      </div>
    </div>
  );
}
