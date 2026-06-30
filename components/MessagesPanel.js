"use client";
// ============================================================
// 文件作用：私信聊天主界面（会话列表 + 聊天窗口 + WebSocket）
// 功能对应：/messages、/messages/[userId]
// 维护指引：
//   - 样式 → MessagesPanel.css
//   - 历史消息 API → /api/chat/with/[userId]
//   - 实时推送 → useChatWebSocket.js
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChatWebSocket } from "@/components/useChatWebSocket";
import "./MessagesPanel.css";

function formatMessageTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function previewText(message) {
  if (!message?.content) return "暂无消息";
  return message.content.length > 28
    ? `${message.content.slice(0, 28)}...`
    : message.content;
}

export default function MessagesPanel({
  currentUserId,
  activePeerId = "",
  initialConversations = [],
  initialThread = null,
}) {
  const router = useRouter();
  const listRef = useRef(null);
  const [conversations, setConversations] = useState(initialConversations);
  const [peer, setPeer] = useState(initialThread?.peer || null);
  const [messages, setMessages] = useState(initialThread?.messages || []);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const activePeerIdRef = useRef(activePeerId);
  useEffect(() => {
    activePeerIdRef.current = activePeerId;
  }, [activePeerId]);

  useEffect(() => {
    setPeer(initialThread?.peer || null);
    setMessages(initialThread?.messages || []);
  }, [initialThread]);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  const upsertConversation = useCallback((peerInfo, message) => {
    setConversations((current) => {
      const others = current.filter((item) => item.peer.id !== peerInfo.id);
      return [
        {
          id: message.conversationId,
          peer: peerInfo,
          updatedAt: message.createdAt,
          lastMessage: message,
        },
        ...others,
      ];
    });
  }, []);

  const handleSocketMessage = useCallback(
    (payload) => {
      if (payload.type !== "message" || !payload.message) return;

      const message = payload.message;
      const involvedPeerId =
        message.senderId === currentUserId ? payload.peerId : message.senderId;

      setConversations((current) => {
        const existing = current.find((item) => item.peer.id === involvedPeerId);
        const peerInfo =
          existing?.peer ||
          (involvedPeerId === peer?.id
            ? peer
            : { id: involvedPeerId, username: "用户", avatarUrl: "/default-avatar.svg" });

        const others = current.filter((item) => item.peer.id !== involvedPeerId);
        return [
          {
            id: message.conversationId,
            peer: peerInfo,
            updatedAt: message.createdAt,
            lastMessage: message,
          },
          ...others,
        ];
      });

      if (involvedPeerId === activePeerIdRef.current) {
        setMessages((current) => {
          if (current.some((item) => item.id === message.id)) return current;
          return [...current, message];
        });
      }
    },
    [currentUserId, peer]
  );

  const { connected, sendMessage } = useChatWebSocket({
    onMessage: handleSocketMessage,
    onError: setError,
  });

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, activePeerId]);

  async function handleSend() {
    const content = draft.trim();
    if (!content || !activePeerId || sending) return;

    setSending(true);
    setError("");

    const sent = sendMessage(activePeerId, content);
    if (sent) {
      setDraft("");
      setSending(false);
      return;
    }

    try {
      const response = await fetch(`/api/chat/with/${activePeerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "发送失败");
      }
      setDraft("");
      handleSocketMessage({
        type: "message",
        peerId: activePeerId,
        message: data.message,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "发送失败");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  const emptyHint = useMemo(() => {
    if (activePeerId) return "";
    return "选择左侧会话，或从文章页点击「私信」开始聊天";
  }, [activePeerId]);

  return (
    <div className="messages-panel">
      <aside className="messages-sidebar">
        <div className="messages-sidebar-head">私信</div>
        <div className="messages-conversation-list">
          {conversations.length === 0 ? (
            <div className="messages-empty-list">暂无会话</div>
          ) : (
            conversations.map((item) => (
              <Link
                key={item.peer.id}
                href={`/messages/${item.peer.id}`}
                className={`messages-conversation-item${
                  activePeerId === item.peer.id
                    ? " messages-conversation-item-active"
                    : ""
                }`}
              >
                <img
                  src={item.peer.avatarUrl || "/default-avatar.svg"}
                  alt={item.peer.username}
                  className="messages-conversation-avatar"
                />
                <div className="messages-conversation-meta">
                  <div className="messages-conversation-top">
                    <span className="messages-conversation-name">
                      {item.peer.username}
                    </span>
                    <span className="messages-conversation-time">
                      {formatMessageTime(item.lastMessage?.createdAt || item.updatedAt)}
                    </span>
                  </div>
                  <div className="messages-conversation-preview">
                    {previewText(item.lastMessage)}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </aside>

      <section className="messages-main">
        {activePeerId && peer ? (
          <>
            <div className="messages-main-head">
              <div className="messages-main-peer">
                <img
                  src={peer.avatarUrl || "/default-avatar.svg"}
                  alt={peer.username}
                  className="messages-main-avatar"
                />
                <div>
                  <div className="messages-main-name">{peer.username}</div>
                  <div className="messages-main-status">
                    {connected ? "在线连接中" : "连接中..."}
                  </div>
                </div>
              </div>
              <Link href={`/user/${peer.id}`} className="messages-profile-link">
                查看主页
              </Link>
            </div>

            <div className="messages-list" ref={listRef}>
              {messages.length === 0 ? (
                <div className="messages-list-empty">还没有消息，打个招呼吧</div>
              ) : (
                messages.map((message) => {
                  const isMine = message.senderId === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={`messages-item${
                        isMine ? " messages-item--mine" : ""
                      }`}
                    >
                      <div className="messages-bubble">{message.content}</div>
                      <div className="messages-time">
                        {formatMessageTime(message.createdAt)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {error ? <div className="messages-error">{error}</div> : null}

            <div className="messages-compose">
              <textarea
                className="messages-input"
                rows={3}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息，Enter 发送，Shift+Enter 换行"
                disabled={sending}
              />
              <button
                type="button"
                className="messages-send-btn"
                onClick={handleSend}
                disabled={sending || !draft.trim()}
              >
                发送
              </button>
            </div>
          </>
        ) : (
          <div className="messages-placeholder">
            <div className="messages-placeholder-icon">💬</div>
            <p>{emptyHint}</p>
          </div>
        )}
      </section>
    </div>
  );
}
