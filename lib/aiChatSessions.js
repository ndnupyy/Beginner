// ============================================================
// 文件作用：AI 对话页会话记录（浏览器 localStorage 持久化）
// 功能对应：/ai 页面左侧近 5 次对话列表
// 维护指引：
//   - 对话记录丢失 / 无法新建 → 本文件
//   - 界面交互 → components/AiChat.js
// ============================================================

// localStorage 键名
const STORAGE_KEY = "ai-chat-sessions";
// 最多保留的会话数量
const MAX_SESSIONS = 5;

// AI 对话欢迎语（新建会话默认首条消息）
export const AI_CHAT_WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "你好，我是你的代码编程大师。你可以问我任何编程相关的问题，例如 bug 排查、代码写法、架构设计、框架用法等。直接描述你的问题即可。",
};

/**
 * 生成会话唯一 ID
 * @returns {string}
 */
function createSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 根据消息列表生成会话标题
 * @param {{ role: string, content: string }[]} messages
 * @returns {string}
 */
export function deriveAiChatSessionTitle(messages) {
  const firstUserMessage = (messages || []).find((item) => item.role === "user");
  if (!firstUserMessage?.content?.trim()) {
    return "新对话";
  }

  const text = firstUserMessage.content.trim();
  return text.length > 18 ? `${text.slice(0, 18)}...` : text;
}

/**
 * 读取全部会话（按最近更新时间倒序）
 * @returns {{ id: string, title: string, messages: object[], updatedAt: string }[]}
 */
export function getAiChatSessions() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item.id === "string")
      .map((item) => ({
        id: item.id,
        title: item.title || "新对话",
        messages: Array.isArray(item.messages) ? item.messages : [AI_CHAT_WELCOME_MESSAGE],
        updatedAt: item.updatedAt || new Date().toISOString(),
      }))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, MAX_SESSIONS);
  } catch {
    return [];
  }
}

/**
 * 写入会话列表到 localStorage
 * @param {{ id: string, title: string, messages: object[], updatedAt: string }[]} sessions
 */
export function saveAiChatSessions(sessions) {
  if (typeof window === "undefined") return;

  try {
    const nextSessions = (sessions || [])
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, MAX_SESSIONS);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions));
  } catch {
    // 存储失败时静默忽略，不影响当前对话
  }
}

/**
 * 创建一条新的空会话
 * @returns {{ id: string, title: string, messages: object[], updatedAt: string }}
 */
export function createAiChatSession() {
  return {
    id: createSessionId(),
    title: "新对话",
    messages: [AI_CHAT_WELCOME_MESSAGE],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 更新指定会话的消息并回写列表
 * @param {{ id: string, title: string, messages: object[], updatedAt: string }[]} sessions
 * @param {string} sessionId
 * @param {object[]} messages
 * @returns {{ id: string, title: string, messages: object[], updatedAt: string }[]}
 */
export function upsertAiChatSession(sessions, sessionId, messages) {
  const now = new Date().toISOString();
  const title = deriveAiChatSessionTitle(messages);
  const existing = (sessions || []).find((item) => item.id === sessionId);

  const updatedSession = {
    id: sessionId,
    title,
    messages,
    updatedAt: now,
  };

  const others = (sessions || []).filter((item) => item.id !== sessionId);
  const nextSessions = [updatedSession, ...others]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, MAX_SESSIONS);

  if (!existing) {
    return [updatedSession, ...others].slice(0, MAX_SESSIONS);
  }

  return nextSessions;
}

/**
 * 初始化会话：无记录时自动创建一条
 * @returns {{ sessions: object[], activeSessionId: string }}
 */
export function initializeAiChatSessions() {
  const sessions = getAiChatSessions();
  if (sessions.length > 0) {
    return {
      sessions,
      activeSessionId: sessions[0].id,
    };
  }

  const firstSession = createAiChatSession();
  const nextSessions = [firstSession];
  saveAiChatSessions(nextSessions);

  return {
    sessions: nextSessions,
    activeSessionId: firstSession.id,
  };
}
