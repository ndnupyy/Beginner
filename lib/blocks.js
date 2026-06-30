// ============================================================
// 文件作用：用户拉黑关系
// 功能对应：私信拉黑、/api/users/[id]/block
// 维护指引：表结构 → prisma/schema.prisma user_blocks
// ============================================================

import { readyDb } from "@/lib/prisma";
import { getUserById } from "@/lib/users";

/** 是否已将对方拉黑 */
export async function hasBlocked(blockerId, blockedId) {
  if (!blockerId || !blockedId || blockerId === blockedId) return false;

  const prisma = await readyDb();
  const row = await prisma.user_blocks.findUnique({
    where: {
      blocker_id_blocked_id: {
        blocker_id: blockerId,
        blocked_id: blockedId,
      },
    },
  });
  return Boolean(row);
}

/** 对方是否已拉黑当前用户 */
export async function isBlockedBy(blockerId, blockedId) {
  return hasBlocked(blockerId, blockedId);
}

/** 拉黑对方 */
export async function blockUser(blockerId, blockedId) {
  if (!blockerId || !blockedId) {
    return { ok: false, error: "无效用户" };
  }
  if (blockerId === blockedId) {
    return { ok: false, error: "不能拉黑自己" };
  }

  const target = await getUserById(blockedId);
  if (!target) {
    return { ok: false, error: "用户不存在" };
  }

  const prisma = await readyDb();
  const now = new Date().toISOString();

  await prisma.user_blocks.upsert({
    where: {
      blocker_id_blocked_id: {
        blocker_id: blockerId,
        blocked_id: blockedId,
      },
    },
    create: {
      blocker_id: blockerId,
      blocked_id: blockedId,
      created_at: now,
    },
    update: {},
  });

  return { ok: true, blocked: true };
}

/** 取消拉黑 */
export async function unblockUser(blockerId, blockedId) {
  if (!blockerId || !blockedId) {
    return { ok: false, error: "无效用户" };
  }

  const prisma = await readyDb();
  try {
    await prisma.user_blocks.delete({
      where: {
        blocker_id_blocked_id: {
          blocker_id: blockerId,
          blocked_id: blockedId,
        },
      },
    });
  } catch {
    // 未拉黑过视为成功
  }

  return { ok: true, blocked: false };
}

/** 切换拉黑状态 */
export async function toggleBlock(blockerId, blockedId) {
  const blocked = await hasBlocked(blockerId, blockedId);
  if (blocked) {
    return unblockUser(blockerId, blockedId);
  }
  return blockUser(blockerId, blockedId);
}
