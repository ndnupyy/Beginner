// ============================================================
// 文件作用：已登录用户看到的博客页面布局（带顶部导航）
// 功能对应：首页、文章详情、写文章、编辑文章等页面的外壳
// 维护指引：
//   - 导航栏问题 → components/Header.js
//   - 登录页不应出现导航栏 → 登录页在 app/login/，不在 (site) 组内
// ============================================================

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import "@/components/SiteShell.css";

export default function SiteLayout({ children }) {
  return (
    <div className="site-layout">
      <Sidebar />
      <div className="site-main">
        <Header />
        {children}
      </div>
    </div>
  );
}
