"use client";
// ============================================================
// 文件作用：AI 编程助手对话界面
// 功能对应：/ai 页面（豆包风格：左侧会话栏 + 居中欢迎区 + 底部输入框）
// 维护指引：
//   - 会话记录 → lib/aiChatSessions.js
//   - 样式 → AiChat.css
//   - API → app/api/ai/chat/route.js
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { renderMessageContent } from "@/components/aiChatRender";
import {
  AI_CHAT_WELCOME_MESSAGE,
  createAiChatSession,
  initializeAiChatSessions,
  saveAiChatSessions,
  upsertAiChatSession,
} from "@/lib/aiChatSessions";
import "./AiChat.css";

// 空对话页中部展示的示例问题（点击后填入输入框）
const SUGGESTION_PROMPTS = [
  "帮我排查这段代码的 bug",
  "解释一下 React Hooks 的用法",
  "如何优化数据库查询性能",
  "写一个快速排序算法",
  "Next.js 路由怎么配置",
  "TypeScript 泛型怎么用",
];

// 输入框下方快捷标签
const QUICK_TAGS = ["代码解释", "Bug 排查", "架构设计", "算法实现"];

export default function AiChat() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [messages, setMessages] = useState([AI_CHAT_WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // 是否已有用户发言（用于切换欢迎页 / 消息列表）
  const hasUserMessages = useMemo(
    () => messages.some((item) => item.role === "user"),
    [messages]
  );

  // 消息区展示列表：有用户消息后隐藏欢迎语气泡
  const displayMessages = useMemo(() => {
    if (!hasUserMessages) return [];
    return messages.filter(
      (item, index) => !(index === 0 && item.role === "assistant")
    );
  }, [hasUserMessages, messages]);

  // 首次进入页面时，从 localStorage 恢复最近 5 条会话
  useEffect(() => {
    const { sessions: initialSessions, activeSessionId: initialActiveId } =
      initializeAiChatSessions();
    const activeSession =
      initialSessions.find((item) => item.id === initialActiveId) ||
      initialSessions[0];

    setSessions(initialSessions);
    setActiveSessionId(activeSession.id);
    setMessages(activeSession.messages);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!hasUserMessages) return;
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [displayMessages, loading, hasUserMessages]);

  /**
   * 将当前会话消息写回左侧列表
   * @param {string} sessionId
   * @param {object[]} nextMessages
   */
  function persistSession(sessionId, nextMessages) {
    setSessions((current) => {
      const nextSessions = upsertAiChatSession(current, sessionId, nextMessages);
      saveAiChatSessions(nextSessions);
      return nextSessions;
    });
  }

  /**
   * 切换到指定会话
   * @param {string} sessionId
   */
  function handleSelectSession(sessionId) {
    if (!sessionId || sessionId === activeSessionId || loading) return;

    const savedSessions = upsertAiChatSession(
      sessions,
      activeSessionId,
      messages
    );
    const target = savedSessions.find((item) => item.id === sessionId);
    if (!target) return;

    saveAiChatSessions(savedSessions);
    setSessions(savedSessions);
    setActiveSessionId(sessionId);
    setMessages(target.messages);
    setError("");
    setInput("");
  }

  /**
   * 新建一条空白对话
   */
  function handleNewChat() {
    if (loading) return;

    const newSession = createAiChatSession();

    setSessions((current) => {
      const savedSessions = upsertAiChatSession(
        current,
        activeSessionId,
        messages
      );
      const nextSessions = [newSession, ...savedSessions].slice(0, 5);
      saveAiChatSessions(nextSessions);
      return nextSessions;
    });

    setActiveSessionId(newSession.id);
    setMessages(newSession.messages);
    setError("");
    setInput("");
    inputRef.current?.focus();
  }

  /**
   * 将推荐问题或快捷标签填入输入框
   * @param {string} text
   */
  function handleFillInput(text) {
    setInput(text);
    inputRef.current?.focus();
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading || !activeSessionId) return;

    const userMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    persistSession(activeSessionId, nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const history = nextMessages.slice(1);
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "请求失败，请稍后重试");
      }

      const completedMessages = [
        ...nextMessages,
        { role: "assistant", content: data.reply },
      ];

      setMessages(completedMessages);
      persistSession(activeSessionId, completedMessages);
    } catch (err) {
      const revertedMessages = nextMessages.slice(0, -1);
      setError(err instanceof Error ? err.message : "请求失败");
      setMessages(revertedMessages);
      persistSession(activeSessionId, revertedMessages);
      setInput(text);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  if (!ready) {
    return <div className="ai-chat ai-chat--loading">加载对话记录中...</div>;
  }

  return (
    <div className="ai-chat">
      <aside className="ai-chat-sidebar" aria-label="对话记录">
        <div className="ai-chat-brand">
          <span className="ai-chat-brand-icon" aria-hidden="true">
            AI
          </span>
          <span className="ai-chat-brand-name">编程助手</span>
        </div>

        <button
          type="button"
          className="ai-chat-new-btn"
          onClick={handleNewChat}
          disabled={loading}
        >
          <span className="ai-chat-new-btn-icon" aria-hidden="true">
            +
          </span>
          新对话
        </button>

        <div className="ai-chat-session-section">
          <p className="ai-chat-session-label">最近对话</p>
          <ul className="ai-chat-session-list">
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  className={`ai-chat-session-item${
                    session.id === activeSessionId
                      ? " ai-chat-session-item-active"
                      : ""
                  }`}
                  onClick={() => handleSelectSession(session.id)}
                  disabled={loading}
                  title={session.title}
                >
                  <span className="ai-chat-session-item-icon" aria-hidden="true">
                    💬
                  </span>
                  <span className="ai-chat-session-item-text">{session.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="ai-chat-main">
        <header className="ai-chat-topbar">
          <h1 className="ai-chat-topbar-title">AI 编程助手</h1>
        </header>

        <div className="ai-chat-body">
          {!hasUserMessages ? (
            <div className="ai-chat-hero">
              <h2 className="ai-chat-hero-title">有什么我能帮你的吗？</h2>
              <div className="ai-chat-suggestions">
                {SUGGESTION_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="ai-chat-suggestion-chip"
                    onClick={() => handleFillInput(prompt)}
                    disabled={loading}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="ai-chat-messages" ref={listRef}>
              {displayMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`ai-chat-message ai-chat-message--${message.role}`}
                >
                  <div className="ai-chat-avatar">
                    {message.role === "user" ? "我" : "AI"}
                  </div>
                  <div className="ai-chat-bubble">
                    {renderMessageContent(message.content)}
                  </div>
                </div>
              ))}

              {loading ? (
                <div className="ai-chat-message ai-chat-message--assistant">
                  <div className="ai-chat-avatar">AI</div>
                  <div className="ai-chat-bubble ai-chat-bubble--loading">
                    <span className="ai-chat-dot" />
                    <span className="ai-chat-dot" />
                    <span className="ai-chat-dot" />
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="ai-chat-composer-wrap">
          {error ? <div className="ai-chat-error">{error}</div> : null}

          <div className="ai-chat-composer">
            <textarea
              ref={inputRef}
              className="ai-chat-input"
              rows={1}
              placeholder="说点什么..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />

            <div className="ai-chat-composer-footer">
              <div className="ai-chat-quick-tags">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="ai-chat-quick-tag"
                    onClick={() => handleFillInput(`请帮我${tag}`)}
                    disabled={loading}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="ai-chat-send-btn"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                aria-label="发送"
              >
                <span aria-hidden="true">↑</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
