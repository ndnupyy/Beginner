// ============================================================
// 文件作用：个人主页
// 访问地址：http://localhost:3000/user/[id]
// 维护指引：
//   - 界面 → components/UserProfilePanel.js
//   - 数据 → lib/profile.js
//   - 头像下拉「个人主页」→ components/Header.js
// ============================================================

import { notFound } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { getUserProfile } from "@/lib/profile";
import UserProfilePanel from "@/components/UserProfilePanel";
import MainPageContainer from "@/components/MainPageContainer";

export default async function UserProfilePage({ params }) {
  const { id } = await params;
  const viewerId = await getSessionUserId();
  const profile = await getUserProfile(id, viewerId);

  if (!profile) {
    notFound();
  }

  return (
    <MainPageContainer className="main-page-container--wide">
      <UserProfilePanel initialProfile={profile} />
    </MainPageContainer>
  );
}
