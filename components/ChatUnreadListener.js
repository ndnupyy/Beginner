"use client";
// ============================================================
// 文件作用：全站私信未读监听（WebSocket 收到他人消息时通知 Header 刷新）
// 功能对应：components/SiteShell.js
// 维护指引：未读 API → GET /api/chat/unread
// ============================================================

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useChatWebSocket } from "@/components/useChatWebSocket";
import { dispatchChatUnreadUpdate } from "@/lib/chatEvents";

export default function ChatUnreadListener({ userId }) {
  const pathname = usePathname();
  const onMessagesPage = pathname.startsWith("/messages");

  useChatWebSocket({
    enabled: !onMessagesPage,
    onMessage: (payload) => {
      if (payload.type !== "message" || !payload.message) return;
      if (payload.message.senderId === userId) return;

      const activePeerId = onMessagesPage
        ? pathname.match(/^\/messages\/([^/]+)/)?.[1]
        : "";

      if (activePeerId && activePeerId === payload.message.senderId) {
        return;
      }

      dispatchChatUnreadUpdate();
    },
  });

  useEffect(() => {
    dispatchChatUnreadUpdate();
  }, [pathname]);

  return null;
}
