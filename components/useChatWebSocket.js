"use client";
// ============================================================
// 文件作用：WebSocket 私信连接 Hook
// 功能对应：components/MessagesPanel.js
// 维护指引：
//   - 开发环境 WS 端口 → NEXT_PUBLIC_WS_PORT（默认 3001）
//   - 需 scripts/dev-runner.js 同时启动 Next 与 chat-ws-server
// ============================================================

import { useEffect, useRef, useState } from "react";

function getChatWsUrl() {
  if (typeof window === "undefined") return "";

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const envUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (envUrl) return envUrl;

  const wsPort = process.env.NEXT_PUBLIC_WS_PORT;
  if (wsPort) {
    return `${protocol}//${window.location.hostname}:${wsPort}/ws/chat`;
  }

  return `${protocol}//${window.location.host}/ws/chat`;
}

/**
 * 建立私信 WebSocket，并提供 sendMessage
 * @param {{ onMessage?: (payload: object) => void, onError?: (message: string) => void, enabled?: boolean }} handlers
 */
export function useChatWebSocket({ onMessage, onError, enabled = true } = {}) {
  const wsRef = useRef(null);
  const handlersRef = useRef({ onMessage, onError });
  const [connected, setConnected] = useState(false);
  const [connectionState, setConnectionState] = useState("connecting");

  useEffect(() => {
    handlersRef.current = { onMessage, onError };
  }, [onMessage, onError]);

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      setConnectionState("connecting");
      return undefined;
    }

    let reconnectTimer = null;
    let closedByUnmount = false;
    let retryCount = 0;

    function connect() {
      setConnectionState(retryCount > 0 ? "reconnecting" : "connecting");

      const ws = new WebSocket(getChatWsUrl());
      wsRef.current = ws;

      ws.addEventListener("open", () => {
        retryCount = 0;
        setConnected(true);
        setConnectionState("connected");
      });

      ws.addEventListener("message", (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "connected") {
            setConnected(true);
            setConnectionState("connected");
            return;
          }
          if (payload.type === "error") {
            handlersRef.current.onError?.(
              payload.message || "发送失败",
              payload.code || ""
            );
            return;
          }
          handlersRef.current.onMessage?.(payload);
        } catch {
          handlersRef.current.onError?.("收到无效消息");
        }
      });

      ws.addEventListener("close", () => {
        setConnected(false);
        if (closedByUnmount) return;

        retryCount += 1;
        setConnectionState("failed");
        reconnectTimer = window.setTimeout(connect, Math.min(retryCount * 2000, 8000));
      });

      ws.addEventListener("error", () => {
        setConnected(false);
        setConnectionState("failed");
      });
    }

    connect();

    return () => {
      closedByUnmount = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [enabled]);

  function sendMessage(peerId, content) {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      onError?.("连接未就绪，请稍后重试", "");
      return false;
    }

    ws.send(
      JSON.stringify({
        type: "send",
        peerId,
        content,
      })
    );
    return true;
  }

  return { connected, connectionState, sendMessage };
}
