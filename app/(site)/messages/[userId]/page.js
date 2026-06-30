// ============================================================
// 文件作用：与指定用户的私信聊天页
// 访问地址：/messages/[userId]
// 维护指引：UI → components/MessagesPanel.js
// ============================================================

import { redirect } from "next/navigation";
import {
  getConversationWithMessages,
  listConversations,
} from "@/lib/chat";
import { getSessionUserId } from "@/lib/session";
import { getUserById } from "@/lib/users";
import MessagesPanel from "@/components/MessagesPanel";
import MainPageContainer from "@/components/MainPageContainer";

export default async function MessagesWithUserPage({ params }) {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login?from=/messages");
  }

  const { userId: peerId } = await params;
  if (!peerId || peerId === userId) {
    redirect("/messages");
  }

  const peer = await getUserById(peerId);
  if (!peer) {
    redirect("/messages");
  }

  const [conversations, thread] = await Promise.all([
    listConversations(userId),
    getConversationWithMessages(userId, peerId),
  ]);

  return (
    <MainPageContainer className="main-page-container--wide">
      <MessagesPanel
        currentUserId={userId}
        activePeerId={peerId}
        initialConversations={conversations}
        initialThread={thread}
      />
    </MainPageContainer>
  );
}
