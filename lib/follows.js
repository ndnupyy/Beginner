// ============================================================
// 文件作用：用户关注关系（关注 / 取消、粉丝数、关注流）
// 功能对应：文章详情关注按钮、/following 页
// ============================================================

import { readyDb } from "@/lib/prisma";
import { getUserById } from "@/lib/users";
import { enrichArticleFromRow } from "@/lib/articles";

const ARTICLES_PER_AUTHOR = 3;
const RECOMMENDED_LIMIT = 10;

export async function getFollowerCount(userId) {
  if (!userId) return 0;

  const prisma = await readyDb();
  return prisma.user_follows.count({
    where: { following_id: userId },
  });
}

/** 用户关注的人数 */
export async function getFollowingCount(userId) {
  if (!userId) return 0;

  const prisma = await readyDb();
  return prisma.user_follows.count({
    where: { follower_id: userId },
  });
}

export async function getFollowingUserIds(followerId) {
  if (!followerId) return [];

  const prisma = await readyDb();
  const rows = await prisma.user_follows.findMany({
    where: { follower_id: followerId },
    select: { following_id: true },
    orderBy: { created_at: "desc" },
  });

  return rows.map((row) => row.following_id);
}

export async function isFollowing(followerId, followingId) {
  if (!followerId || !followingId) return false;

  const prisma = await readyDb();
  const row = await prisma.user_follows.findUnique({
    where: {
      follower_id_following_id: {
        follower_id: followerId,
        following_id: followingId,
      },
    },
  });

  return Boolean(row);
}

/** 是否互相关注 */
export async function isMutualFollow(userAId, userBId) {
  if (!userAId || !userBId || userAId === userBId) return false;

  const [aFollowsB, bFollowsA] = await Promise.all([
    isFollowing(userAId, userBId),
    isFollowing(userBId, userAId),
  ]);

  return aFollowsB && bFollowsA;
}

export async function getFollowState(followerId, followingId) {
  const fansCount = await getFollowerCount(followingId);
  const following = followerId
    ? await isFollowing(followerId, followingId)
    : false;

  return { following, fansCount };
}

export async function toggleFollow(followerId, followingId) {
  if (!followerId) {
    throw new Error("未登录");
  }
  if (!followingId) {
    throw new Error("无效的作者");
  }
  if (followerId === followingId) {
    throw new Error("不能关注自己");
  }

  const targetUser = await getUserById(followingId);
  if (!targetUser) {
    throw new Error("用户不存在");
  }

  const prisma = await readyDb();
  const compositeKey = {
    follower_id_following_id: {
      follower_id: followerId,
      following_id: followingId,
    },
  };

  const existing = await prisma.user_follows.findUnique({
    where: compositeKey,
  });

  if (existing) {
    await prisma.user_follows.delete({ where: compositeKey });
  } else {
    await prisma.user_follows.create({
      data: {
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date().toISOString(),
      },
    });
  }

  return getFollowState(followerId, followingId);
}

/** 关注作者的最近若干篇文章（每位作者最多 3 篇） */
export async function getFollowingFeed(followerId, articlesPerAuthor = ARTICLES_PER_AUTHOR) {
  const followingIds = await getFollowingUserIds(followerId);
  if (followingIds.length === 0) return [];

  const prisma = await readyDb();
  const rows = [];

  for (const authorId of followingIds) {
    const authorRows = await prisma.articles.findMany({
      where: { author_id: authorId, status: "published" },
      orderBy: { created_at: "desc" },
      take: articlesPerAuthor,
    });
    rows.push(...authorRows);
  }

  rows.sort((a, b) => b.created_at.localeCompare(a.created_at));

  return Promise.all(rows.map(enrichArticleFromRow));
}

function pickAuthorTagline(articles) {
  const category = articles.find((row) => row.category?.trim())?.category?.trim();
  if (category) return `${category} · 博客作者`;
  if (articles.length > 0) return `已发布 ${articles.length} 篇文章`;
  return "博客作者";
}

/** 推荐作者：有已发布文章、排除自己和已关注的人 */
export async function getRecommendedAuthors(viewerId, limit = RECOMMENDED_LIMIT) {
  const prisma = await readyDb();
  const followingIds = viewerId ? await getFollowingUserIds(viewerId) : [];
  const excludeIds = new Set(
    [viewerId, ...followingIds].filter(Boolean)
  );

  const users = await prisma.users.findMany({
    orderBy: { created_at: "asc" },
  });

  const candidates = [];

  for (const user of users) {
    if (excludeIds.has(user.id)) continue;

    const articles = await prisma.articles.findMany({
      where: { author_id: user.id, status: "published" },
      select: { category: true },
    });

    if (articles.length === 0) continue;

    const fansCount = await getFollowerCount(user.id);

    candidates.push({
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatar_url || "/default-avatar.svg",
      tagline: pickAuthorTagline(articles),
      articleCount: articles.length,
      fansCount,
      isFollowing: false,
    });
  }

  candidates.sort((a, b) => {
    if (b.articleCount !== a.articleCount) {
      return b.articleCount - a.articleCount;
    }
    return b.fansCount - a.fansCount;
  });

  return candidates.slice(0, limit);
}
