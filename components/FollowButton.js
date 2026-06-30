"use client";
// ============================================================
// 文件作用：关注 / 取消关注按钮
// 功能对应：AuthorSidebar、RecommendedAuthors
// ============================================================

import { useState } from "react";
import "./FollowButton.css";

export default function FollowButton({
  userId,
  initialFollowing = false,
  initialFansCount,
  onFansCountChange,
  onFollowingChange,
  size = "default",
  disabled = false,
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [fansCount, setFansCount] = useState(initialFansCount);
  const [loading, setLoading] = useState(false);

  if (!userId || disabled) return null;

  async function handleToggle() {
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "操作失败");
      }

      setFollowing(data.following);
      setFansCount(data.fansCount);
      onFansCountChange?.(data.fansCount);
      onFollowingChange?.(data.following);
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "关注操作失败，请稍后再试"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className={`follow-btn follow-btn--${size}${
        following ? " is-following" : ""
      }`}
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? "处理中…" : following ? "已关注" : "关注"}
    </button>
  );
}

export function useFollowButtonFansCount(initialFansCount) {
  const [fansCount, setFansCount] = useState(initialFansCount);
  return [fansCount, setFansCount];
}
