"use client";
// ============================================================
// 文件作用：WebSocket 私信连接 Hook
// 功能对应：components/MessagesPanel.js
// 维护指引：连接地址 /ws/chat，需 node server.js 启动
// ============================================================

import { useEffect, useRef, useState } from "react";

function getChatWsUrl() {
  if (typeof window === "undefined") return "";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/chat`;
}

/**
 * 建立私信 WebSocket，并提供 sendMessage
 * @param {{ onMessage?: (payload: object) => void, onError?: (message: string) => void }} handlers
 */
export function useChatWebSocket({ onMessage, onError } = {}) {
  const wsRef = useRef(null);
  const handlersRef = useRef({ onMessage, onError });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    handlersRef.current = { onMessage, onError };
  }, [onMessage, onError]);

  useEffect(() => {
    let reconnectTimer = null;
    let closedByUnmount = false;

    function connect() {
      const ws = new WebSocket(getChatWsUrl());
      wsRef.current = ws;

      ws.addEventListener("open", () => {
        setConnected(true);
      });

      ws.addEventListener("message", (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "error") {
            handlersRef.current.onError?.(payload.message || "发送失败");
            return;
          }
          handlersRef.current.onMessage?.(payload);
        } catch {
          handlersRef.current.onError?.("收到无效消息");
        }
      });

      ws.addEventListener("close", () => {
        setConnected(false);
        if (!closedByUnmount) {
          reconnectTimer = window.setTimeout(connect, 2000);
        }
      });

      ws.addEventListener("error", () => {
        setConnected(false);
      });
    }

    connect();

    return () => {
      closedByUnmount = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, []);

  function sendMessage(peerId, content) {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      onError?.("连接未就绪，请稍后重试");
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

  return { connected, sendMessage };
}
