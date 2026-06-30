"use client";
// ============================================================
// 文件作用：左侧窄边栏导航（首页、AI 对话、关注、收藏、历史）
// 功能对应：已登录博客页面的左侧快捷入口
// 维护指引：
//   - 样式 / 图标 → Sidebar.css
//   - 新增入口 → NAV_ITEMS 数组
//   - 对应页面 → app/(site)/ 下各子路由
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./Sidebar.css";

const NAV_ITEMS = [
  {
    href: "/",
    label: "首页",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
      </svg>
    ),
  },
  {
    href: "/ai",
    label: "AI对话",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3a7 7 0 0 1 7 7c0 2.8-1.6 5.2-4 6.3V19l-3-2-3 2v-2.7A7 7 0 0 1 5 10a7 7 0 0 1 7-7Z" />
        <circle cx="9.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
        <circle cx="14.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
    accent: true,
  },
  { divider: true },
  {
    href: "/following",
    label: "关注",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
        <path d="M16 11v6M19 14h-6" />
      </svg>
    ),
  },
  {
    href: "/favorites",
    label: "收藏",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 4h12v16l-6-4-6 4V4Z" />
      </svg>
    ),
  },
  {
    href: "/history",
    label: "历史",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
];

function isActive(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar" aria-label="主导航">
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item, index) => {
          if (item.divider) {
            return <div key={`divider-${index}`} className="sidebar-divider" />;
          }

          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item${active ? " sidebar-item-active" : ""}${
                item.accent ? " sidebar-item-accent" : ""
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
