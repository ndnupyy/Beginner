// ============================================================
// 文件作用：浏览历史页
// 访问地址：http://localhost:3000/history
// 维护指引：
//   - 列表交互 → components/HistoryList.js
//   - 记录逻辑 → lib/history.js
// ============================================================

import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { getBrowseHistory } from "@/lib/history";
import HistoryList from "@/components/HistoryList";
import MainPageContainer from "@/components/MainPageContainer";

export default async function HistoryPage() {
  const userId = await getSessionUserId();

  if (!userId) {
    redirect("/login?from=/history");
  }

  const articles = await getBrowseHistory(userId);

  return (
    <MainPageContainer className="main-page-container--history">
      <HistoryList articles={articles} />
    </MainPageContainer>
  );
}
