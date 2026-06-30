// ============================================================
// 文件作用：收藏页（收藏夹 + 收藏文章列表）
// 访问地址：http://localhost:3000/favorites
// 维护指引：
//   - 界面交互 → components/FavoritesPanel.js
//   - 收藏夹逻辑 → lib/favorites.js
// ============================================================

import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import {
  ensureDefaultFolder,
  getFavoriteFolders,
  getFolderArticles,
} from "@/lib/favorites";
import FavoritesPanel from "@/components/FavoritesPanel";
import "./favorites.css";

export default async function FavoritesPage() {
  const userId = await getSessionUserId();

  if (!userId) {
    redirect("/login?from=/favorites");
  }

  await ensureDefaultFolder(userId);
  const folders = await getFavoriteFolders(userId);
  const activeFolder = folders[0] || null;
  const initialData = activeFolder
    ? await getFolderArticles(userId, activeFolder.id)
    : { folder: null, articles: [] };

  return (
    <div className="page-container favorites-page">
      <h1 className="page-title">收藏</h1>
      <FavoritesPanel
        initialFolders={folders}
        initialFolderId={activeFolder?.id || null}
        initialArticles={initialData?.articles || []}
      />
    </div>
  );
}
