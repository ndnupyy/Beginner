// ============================================================
// 文件作用：私信会话与消息读写
// 功能对应：/messages、WebSocket 实时聊天、/api/chat/*
// 维护指引：
//   - 表结构 → prisma/schema.prisma chat_*
//   - 实时推送 → lib/chatWsServer.js
// ============================================================

import { readyDb } from "@/lib/prisma";
import { getUserById } from "@/lib/users";

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

/** 当前用户的会话列表（含最后一条消息） */
export async function listConversations(userId) {
  if (!userId) return [];

  const prisma = await readyDb();
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

    conversations.push({
      id: row.id,
      peer,
      updatedAt: row.updated_at,
      lastMessage: row.messages[0] ? rowToMessage(row.messages[0]) : null,
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

  return {
    conversation: {
      id: conversation.id,
      updatedAt: conversation.updated_at,
    },
    peer,
    messages: messages.map(rowToMessage),
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
