"use client";
// ============================================================
// 文件作用：AI 编程助手对话界面
// 功能对应：/ai 页面
// ============================================================

import { useEffect, useRef, useState } from "react";
import { renderMessageContent } from "@/components/aiChatRender";
import "./AiChat.css";

const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "你好，我是你的代码编程大师。你可以问我任何编程相关的问题，例如 bug 排查、代码写法、架构设计、框架用法等。直接描述你的问题即可。",
};

export default function AiChat() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
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

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败");
      setMessages((current) => current.slice(0, -1));
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

  function handleClear() {
    setMessages([WELCOME_MESSAGE]);
    setError("");
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <div className="ai-chat">
      <div className="ai-chat-header">
        <div>
          <h1 className="ai-chat-title">AI 编程助手</h1>
          <p className="ai-chat-subtitle">代码编程大师 · 解答你的编程问题</p>
        </div>
        <button
          type="button"
          className="ai-chat-clear-btn"
          onClick={handleClear}
          disabled={loading}
        >
          清空对话
        </button>
      </div>

      <div className="ai-chat-panel">
        <div className="ai-chat-messages" ref={listRef}>
          {messages.map((message, index) => (
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

        {error ? <div className="ai-chat-error">{error}</div> : null}

        <div className="ai-chat-input-area">
          <textarea
            ref={inputRef}
            className="ai-chat-input"
            rows={3}
            placeholder="描述你的编程问题，Enter 发送，Shift+Enter 换行"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            type="button"
            className="ai-chat-send-btn"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            {loading ? "思考中…" : "发送"}
          </button>
        </div>
      </div>
    </div>
  );
}
