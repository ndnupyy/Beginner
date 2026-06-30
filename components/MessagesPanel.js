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
import { useChatWebSocket } from "@/components/useChatWebSocket";
import { dispatchChatUnreadUpdate } from "@/lib/chatEvents";
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
  const listRef = useRef(null);
  const [conversations, setConversations] = useState(initialConversations);
  const [peer, setPeer] = useState(initialThread?.peer || null);
  const [messages, setMessages] = useState(initialThread?.messages || []);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [policy, setPolicy] = useState(initialThread?.policy || null);
  const [sending, setSending] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const activePeerIdRef = useRef(activePeerId);
  useEffect(() => {
    activePeerIdRef.current = activePeerId;
  }, [activePeerId]);

  useEffect(() => {
    setPeer(initialThread?.peer || null);
    setMessages(initialThread?.messages || []);
    setPolicy(initialThread?.policy || null);
    setError("");
    setErrorCode("");
  }, [initialThread]);

  const refreshPolicy = useCallback(async (peerId) => {
    if (!peerId) return;
    try {
      const response = await fetch(`/api/chat/with/${peerId}`);
      if (!response.ok) return;
      const data = await response.json();
      setPolicy(data.policy || null);
    } catch {
      // 忽略
    }
  }, []);

  useEffect(() => {
    if (activePeerId && !initialThread?.policy) {
      refreshPolicy(activePeerId);
    }
  }, [activePeerId, initialThread?.policy, refreshPolicy]);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  const markConversationRead = useCallback(async (peerId) => {
    if (!peerId) return;

    try {
      await fetch(`/api/chat/with/${peerId}/read`, { method: "POST" });
      setConversations((current) =>
        current.map((item) =>
          item.peer.id === peerId ? { ...item, unreadCount: 0 } : item
        )
      );
      dispatchChatUnreadUpdate();
    } catch {
      // 标记失败不影响聊天
    }
  }, []);

  useEffect(() => {
    if (!activePeerId) return;
    markConversationRead(activePeerId);
  }, [activePeerId, markConversationRead]);

  const handleSocketMessage = useCallback(
    (payload) => {
      if (payload.type !== "message" || !payload.message) return;

      const message = payload.message;
      const involvedPeerId =
        message.senderId === currentUserId ? payload.peerId : message.senderId;
      const isIncoming = message.senderId !== currentUserId;
      const isActiveChat = involvedPeerId === activePeerIdRef.current;

      setConversations((current) => {
        const existing = current.find((item) => item.peer.id === involvedPeerId);
        const peerInfo =
          existing?.peer ||
          (involvedPeerId === peer?.id
            ? peer
            : { id: involvedPeerId, username: "用户", avatarUrl: "/default-avatar.svg" });

        const others = current.filter((item) => item.peer.id !== involvedPeerId);
        const nextUnread = isActiveChat
          ? 0
          : isIncoming
          ? (existing?.unreadCount || 0) + 1
          : existing?.unreadCount || 0;

        return [
          {
            id: message.conversationId,
            peer: peerInfo,
            updatedAt: message.createdAt,
            lastMessage: message,
            unreadCount: nextUnread,
          },
          ...others,
        ];
      });

      if (isIncoming && !isActiveChat) {
        dispatchChatUnreadUpdate();
      }

      if (isActiveChat) {
        markConversationRead(involvedPeerId);
      }

      if (involvedPeerId === activePeerIdRef.current) {
        setMessages((current) => {
          if (current.some((item) => item.id === message.id)) return current;
          return [...current, message];
        });
        refreshPolicy(involvedPeerId);
      }
    },
    [currentUserId, peer, markConversationRead, refreshPolicy]
  );

  function handleChatError(message, code = "") {
    setError(message);
    setErrorCode(code);
  }

  const { connected, connectionState, sendMessage } = useChatWebSocket({
    onMessage: handleSocketMessage,
    onError: handleChatError,
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
    if (policy && !policy.canSend) {
      handleChatError(policy.error || policy.warning || "当前无法发送消息", policy.code);
      return;
    }

    setSending(true);
    setError("");
    setErrorCode("");

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
        handleChatError(data.error || "发送失败", data.code || "");
        return;
      }
      setDraft("");
      handleSocketMessage({
        type: "message",
        peerId: activePeerId,
        message: data.message,
      });
      await refreshPolicy(activePeerId);
    } catch (err) {
      handleChatError(err instanceof Error ? err.message : "发送失败", "");
    } finally {
      setSending(false);
    }
  }

  async function handleToggleBlock() {
    if (!activePeerId || blocking) return;
    const confirmText = policy?.hasBlockedPeer
      ? "确定取消拉黑该用户吗？"
      : "拉黑后将不再接收对方消息，确定拉黑吗？";
    if (!window.confirm(confirmText)) return;

    setBlocking(true);
    try {
      const response = await fetch(`/api/users/${activePeerId}/block`, {
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "操作失败");
      }
      await refreshPolicy(activePeerId);
      setError("");
      setErrorCode("");
    } catch (err) {
      handleChatError(err instanceof Error ? err.message : "操作失败", "");
    } finally {
      setBlocking(false);
    }
  }

  const inputDisabled =
    sending || blocking || Boolean(policy && !policy.canSend);

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
        <div className="messages-sidebar-head">
          私信
          {conversations.reduce((sum, item) => sum + (item.unreadCount || 0), 0) > 0 ? (
            <span className="messages-sidebar-unread">
              {conversations.reduce((sum, item) => sum + (item.unreadCount || 0), 0)}
            </span>
          ) : null}
        </div>
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
                }${item.unreadCount > 0 ? " messages-conversation-item-unread" : ""}`}
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
                  <div className="messages-conversation-preview-row">
                    <div className="messages-conversation-preview">
                      {previewText(item.lastMessage)}
                    </div>
                    {item.unreadCount > 0 ? (
                      <span className="messages-conversation-badge">
                        {item.unreadCount > 99 ? "99+" : item.unreadCount}
                      </span>
                    ) : null}
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
                  <div
                    className={`messages-main-status${
                      connectionState === "failed"
                        ? " messages-main-status--failed"
                        : ""
                    }`}
                  >
                    {connectionState === "connected"
                      ? "在线连接中"
                      : connectionState === "failed"
                      ? "连接失败，正在重试…"
                      : "连接中…"}
                  </div>
                </div>
              </div>
              <div className="messages-main-actions">
                <button
                  type="button"
                  className={`messages-block-btn${
                    policy?.hasBlockedPeer ? " messages-block-btn-active" : ""
                  }`}
                  onClick={handleToggleBlock}
                  disabled={blocking}
                >
                  {policy?.hasBlockedPeer ? "取消拉黑" : "拉黑"}
                </button>
                <Link href={`/user/${peer.id}`} className="messages-profile-link">
                  查看主页
                </Link>
              </div>
            </div>

            {policy?.blockedByPeer ? (
              <div className="messages-policy-blocked">你已被拉黑</div>
            ) : null}

            {policy?.warning && policy.canSend && !policy.blockedByPeer ? (
              <div className="messages-policy-warning">{policy.warning}</div>
            ) : null}

            {policy?.hasBlockedPeer ? (
              <div className="messages-policy-muted">你已拉黑对方，无法继续发送消息</div>
            ) : null}

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

            {error ? (
              <div
                className={`messages-error${
                  errorCode === "BLOCKED_BY_PEER" ? " messages-error--blocked" : ""
                }`}
              >
                {error}
              </div>
            ) : null}

            <div className="messages-compose">
              <textarea
                className="messages-input"
                rows={4}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  policy?.blockedByPeer
                    ? "你已被拉黑，无法发送消息"
                    : policy && !policy.canSend
                    ? policy.error || "当前无法发送消息"
                    : "输入消息，Enter 发送，Shift+Enter 换行"
                }
                disabled={inputDisabled}
              />
              <button
                type="button"
                className="messages-send-btn"
                onClick={handleSend}
                disabled={inputDisabled || !draft.trim()}
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
