// ============================================================
// 文件作用：已登录用户看到的博客页面布局（带顶部导航）
// 功能对应：首页、文章详情、写文章、编辑文章等页面的外壳
// 维护指引：
//   - 导航栏问题 → components/Header.js
//   - 主体区骨架 → components/SiteShell.js（.site-main-body）
//   - 新功能页容器 → components/MainPageContainer.js（/history 起使用）
//   - 登录页不应出现导航栏 → 登录页在 app/login/，不在 (site) 组内
// ============================================================

import SiteShell from "@/components/SiteShell";

export default function SiteLayout({ children }) {
  return <SiteShell>{children}</SiteShell>;
}
