// ============================================================
// 文件作用：私信未读数变更事件（跨组件通知 Header 刷新）
// 功能对应：MessagesPanel、ChatUnreadListener → Header
// ============================================================

export const CHAT_UNREAD_EVENT = "blog-chat-unread-update";

/** 通知全站刷新未读私信数 */
export function dispatchChatUnreadUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CHAT_UNREAD_EVENT));
  }
}
