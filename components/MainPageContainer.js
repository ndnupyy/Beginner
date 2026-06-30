// ============================================================
// 文件作用：页面主体内容容器（居中、固定宽高范围）
// 功能对应：/history 及之后的新功能页统一外壳
// 维护指引：
//   - 尺寸 / 居中 → MainPageContainer.css
//   - 布局骨架 → components/SiteShell.js .site-main-body
//   - 旧页面（首页、收藏、关注等）仍用 page-container，无需改用本组件
// ============================================================

import "./MainPageContainer.css";

/**
 * MainPageContainer - 站点主体功能页容器
 * @param {Object} props
 * @param {React.ReactNode} props.children - 页面内容
 * @param {string} [props.className] - 额外 class
 */
export default function MainPageContainer({ children, className = "" }) {
  const mergedClassName = className
    ? `main-page-container ${className}`
    : "main-page-container";

  return <div className={mergedClassName}>{children}</div>;
}
