// ============================================================
// 文件作用：私信会话与消息读写
// 功能对应：/messages、WebSocket 实时聊天、/api/chat/*
// 维护指引：
//   - 表结构 → prisma/schema.prisma chat_*
//   - 实时推送 → lib/chatWsServer.js
// ============================================================

import { readyDb } from "@/lib/prisma";
import { getUserById } from "@/lib/users";
import { hasBlocked, isBlockedBy } from "@/lib/blocks";
import { isMutualFollow } from "@/lib/follows";

const ONE_MESSAGE_WARNING = "在对方未回复之前你只能发送一条消息";
const BLOCKED_ERROR = "你已被拉黑";

function sortPair(userId, peerId) {
  return userId < peerId ? [userId, peerId] : [peerId, userId];
}

function rowToMessage(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: row.created_at,
  };
}

async function getPeerSummary(peerId) {
  const user = await getUserById(peerId);
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl || "/default-avatar.svg",
  };
}

/** 获取或创建两人之间的会话 */
export async function getOrCreateConversation(userId, peerId) {
  if (!userId || !peerId || userId === peerId) {
    return null;
  }

  const peer = await getUserById(peerId);
  if (!peer) return null;

  const prisma = await readyDb();
  const [userAId, userBId] = sortPair(userId, peerId);
  const now = new Date().toISOString();

  let conversation = await prisma.chat_conversations.findUnique({
    where: {
      user_a_id_user_b_id: {
        user_a_id: userAId,
        user_b_id: userBId,
      },
    },
  });

  if (!conversation) {
    conversation = await prisma.chat_conversations.create({
      data: {
        id: crypto.randomUUID(),
        user_a_id: userAId,
        user_b_id: userBId,
        created_at: now,
        updated_at: now,
      },
    });
  }

  return conversation;
}

/** 判断用户是否属于该会话 */
export function isConversationParticipant(conversation, userId) {
  if (!conversation || !userId) return false;
  return conversation.user_a_id === userId || conversation.user_b_id === userId;
}

export function getConversationPeerId(conversation, userId) {
  if (!conversation) return null;
  return conversation.user_a_id === userId
    ? conversation.user_b_id
    : conversation.user_a_id;
}

/** 统计某会话中当前用户未读消息数 */
async function countUnreadInConversation(prisma, userId, conversationId, lastReadAt) {
  return prisma.chat_messages.count({
    where: {
      conversation_id: conversationId,
      sender_id: { not: userId },
      created_at: { gt: lastReadAt || "1970-01-01T00:00:00.000Z" },
    },
  });
}

/** 获取当前用户私信未读汇总 */
export async function getUnreadSummary(userId) {
  if (!userId) {
    return { totalUnread: 0, byPeer: {} };
  }

  const prisma = await readyDb();
  const conversations = await prisma.chat_conversations.findMany({
    where: {
      OR: [{ user_a_id: userId }, { user_b_id: userId }],
    },
  });

  const reads = await prisma.chat_conversation_reads.findMany({
    where: { user_id: userId },
  });
  const readMap = new Map(
    reads.map((row) => [row.conversation_id, row.last_read_at])
  );

  let totalUnread = 0;
  const byPeer = {};

  for (const conversation of conversations) {
    const unreadCount = await countUnreadInConversation(
      prisma,
      userId,
      conversation.id,
      readMap.get(conversation.id)
    );
    if (unreadCount > 0) {
      const peerId = getConversationPeerId(conversation, userId);
      byPeer[peerId] = unreadCount;
      totalUnread += unreadCount;
    }
  }

  return { totalUnread, byPeer };
}

/** 将某会话标记为已读 */
export async function markConversationRead(userId, peerId) {
  const conversation = await getOrCreateConversation(userId, peerId);
  if (!conversation) {
    return { ok: false, error: "会话不存在" };
  }

  const prisma = await readyDb();
  const now = new Date().toISOString();
  const lastMessage = await prisma.chat_messages.findFirst({
    where: { conversation_id: conversation.id },
    orderBy: { created_at: "desc" },
  });
  const lastReadAt = lastMessage?.created_at || now;

  await prisma.chat_conversation_reads.upsert({
    where: {
      user_id_conversation_id: {
        user_id: userId,
        conversation_id: conversation.id,
      },
    },
    create: {
      user_id: userId,
      conversation_id: conversation.id,
      last_read_at: lastReadAt,
    },
    update: {
      last_read_at: lastReadAt,
    },
  });

  return { ok: true };
}

/**
 * 计算私信发送策略（互关 / 首条限制 / 拉黑）
 * @param {string} userId - 当前用户
 * @param {string} peerId - 对方
 * @param {Array<{ senderId: string }>} messages - 会话消息（按时间升序）
 */
export async function getChatSendPolicy(userId, peerId, messages = []) {
  const blockedByPeer = await isBlockedBy(peerId, userId);
  const hasBlockedPeer = await hasBlocked(userId, peerId);
  const mutualFollow = await isMutualFollow(userId, peerId);

  if (blockedByPeer) {
    return {
      canSend: false,
      warning: "",
      error: BLOCKED_ERROR,
      code: "BLOCKED_BY_PEER",
      blockedByPeer: true,
      hasBlockedPeer,
      isMutualFollow: mutualFollow,
      oneMessageLimit: false,
    };
  }

  if (hasBlockedPeer) {
    return {
      canSend: false,
      warning: "你已拉黑对方，无法继续发送消息",
      error: "你已拉黑对方，无法继续发送消息",
      code: "BLOCKED_PEER",
      blockedByPeer: false,
      hasBlockedPeer: true,
      isMutualFollow: mutualFollow,
      oneMessageLimit: false,
    };
  }

  if (mutualFollow) {
    return {
      canSend: true,
      warning: "",
      error: "",
      code: "MUTUAL_FOLLOW",
      blockedByPeer: false,
      hasBlockedPeer: false,
      isMutualFollow: true,
      oneMessageLimit: false,
    };
  }

  if (messages.length === 0) {
    return {
      canSend: true,
      warning: ONE_MESSAGE_WARNING,
      error: "",
      code: "ONE_MESSAGE_PENDING",
      blockedByPeer: false,
      hasBlockedPeer: false,
      isMutualFollow: false,
      oneMessageLimit: true,
    };
  }

  const initiatorId = messages[0].senderId;
  const recipientReplied = messages.some((item) => item.senderId !== initiatorId);

  if (recipientReplied) {
    return {
      canSend: true,
      warning: "",
      error: "",
      code: "UNLOCKED",
      blockedByPeer: false,
      hasBlockedPeer: false,
      isMutualFollow: false,
      oneMessageLimit: false,
    };
  }

  if (userId === initiatorId) {
    const initiatorSent = messages.filter((item) => item.senderId === initiatorId).length;
    if (initiatorSent >= 1) {
      return {
        canSend: false,
        warning: ONE_MESSAGE_WARNING,
        error: ONE_MESSAGE_WARNING,
        code: "ONE_MESSAGE_LIMIT",
        blockedByPeer: false,
        hasBlockedPeer: false,
        isMutualFollow: false,
        oneMessageLimit: true,
      };
    }
  }

  return {
    canSend: true,
    warning: userId === initiatorId ? ONE_MESSAGE_WARNING : "",
    error: "",
    code: userId === initiatorId ? "ONE_MESSAGE_PENDING" : "CAN_REPLY",
    blockedByPeer: false,
    hasBlockedPeer: false,
    isMutualFollow: false,
    oneMessageLimit: userId === initiatorId,
  };
}

/** 校验是否允许发送（发送前调用） */
export async function validateMessageSend(userId, peerId, conversationId) {
  const prisma = await readyDb();
  const messages = conversationId
    ? (
        await prisma.chat_messages.findMany({
          where: { conversation_id: conversationId },
          orderBy: { created_at: "asc" },
        })
      ).map(rowToMessage)
    : [];

  const policy = await getChatSendPolicy(userId, peerId, messages);
  if (!policy.canSend) {
    return { ok: false, error: policy.error, code: policy.code };
  }
  return { ok: true, policy };
}

/** 当前用户的会话列表（含最后一条消息） */
export async function listConversations(userId) {
  if (!userId) return [];

  const prisma = await readyDb();
  const reads = await prisma.chat_conversation_reads.findMany({
    where: { user_id: userId },
  });
  const readMap = new Map(
    reads.map((row) => [row.conversation_id, row.last_read_at])
  );

  const rows = await prisma.chat_conversations.findMany({
    where: {
      OR: [{ user_a_id: userId }, { user_b_id: userId }],
    },
    orderBy: { updated_at: "desc" },
    include: {
      messages: {
        orderBy: { created_at: "desc" },
        take: 1,
      },
    },
  });

  const conversations = [];
  for (const row of rows) {
    const peerId = getConversationPeerId(row, userId);
    const peer = await getPeerSummary(peerId);
    if (!peer) continue;

    const unreadCount = await countUnreadInConversation(
      prisma,
      userId,
      row.id,
      readMap.get(row.id)
    );

    conversations.push({
      id: row.id,
      peer,
      updatedAt: row.updated_at,
      lastMessage: row.messages[0] ? rowToMessage(row.messages[0]) : null,
      unreadCount,
    });
  }

  return conversations;
}

/** 获取与某用户的会话及历史消息 */
export async function getConversationWithMessages(userId, peerId, limit = 50) {
  const conversation = await getOrCreateConversation(userId, peerId);
  if (!conversation) return null;

  const peer = await getPeerSummary(peerId);
  if (!peer) return null;

  const prisma = await readyDb();
  const messages = await prisma.chat_messages.findMany({
    where: { conversation_id: conversation.id },
    orderBy: { created_at: "asc" },
    take: limit,
  });

  const mappedMessages = messages.map(rowToMessage);
  const policy = await getChatSendPolicy(userId, peerId, mappedMessages);

  return {
    conversation: {
      id: conversation.id,
      updatedAt: conversation.updated_at,
    },
    peer,
    messages: mappedMessages,
    policy,
  };
}

/** 写入一条消息并更新会话时间 */
export async function createChatMessage({ conversationId, senderId, content }) {
  const text = (content || "").trim();
  if (!text) {
    return { ok: false, error: "消息不能为空" };
  }

  const prisma = await readyDb();
  const conversation = await prisma.chat_conversations.findUnique({
    where: { id: conversationId },
  });

  if (!conversation || !isConversationParticipant(conversation, senderId)) {
    return { ok: false, error: "无权发送消息" };
  }

  const peerId = getConversationPeerId(conversation, senderId);
  const validation = await validateMessageSend(senderId, peerId, conversationId);
  if (!validation.ok) {
    return {
      ok: false,
      error: validation.error,
      code: validation.code,
    };
  }

  const now = new Date().toISOString();
  const message = await prisma.chat_messages.create({
    data: {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      sender_id: senderId,
      content: text,
      created_at: now,
    },
  });

  await prisma.chat_conversations.update({
    where: { id: conversationId },
    data: { updated_at: now },
  });

  return {
    ok: true,
    message: rowToMessage(message),
    peerId: getConversationPeerId(conversation, senderId),
  };
}

/** 向指定用户发送私信（自动创建会话） */
export async function sendMessageToUser(senderId, peerId, content) {
  const conversation = await getOrCreateConversation(senderId, peerId);
  if (!conversation) {
    return { ok: false, error: "无法创建会话" };
  }

  return createChatMessage({
    conversationId: conversation.id,
    senderId,
    content,
  });
}
