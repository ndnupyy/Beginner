// ============================================================
// 文件作用：私信会话列表页
// 访问地址：/messages
// 维护指引：UI → components/MessagesPanel.js
// ============================================================

import { redirect } from "next/navigation";
import { listConversations } from "@/lib/chat";
import { getSessionUserId } from "@/lib/session";
import { getUserById } from "@/lib/users";
import MessagesPanel from "@/components/MessagesPanel";
import MainPageContainer from "@/components/MainPageContainer";

export default async function MessagesPage() {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login?from=/messages");
  }

  const [conversations, currentUser] = await Promise.all([
    listConversations(userId),
    getUserById(userId),
  ]);

  if (!currentUser) {
    redirect("/login?from=/messages");
  }

  return (
    <MainPageContainer className="main-page-container--wide">
      <MessagesPanel
        currentUserId={userId}
        initialConversations={conversations}
      />
    </MainPageContainer>
  );
}
