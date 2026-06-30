// ============================================================
// 文件作用：根布局组件（整个网站的"外壳"）
// 功能对应：所有页面共享的 HTML 结构、导航栏、全局样式
// 每个页面都会自动被这个 layout 包裹
// 如果导航栏不显示 / 页面结构出问题，检查这个文件
// ============================================================

// 引入全局 CSS 样式
import "./globals.css";

// 页面的 metadata（标题、描述），用于 SEO 和浏览器标签页标题
export const metadata = {
  title: "简易博客 - 学习 Next.js 入门项目",
  description: "一个带详细注释的 Next.js 博客平台，适合零基础学习",
};

/**
 * RootLayout - 根布局组件
 * 登录页不显示导航栏；博客页面由 (site)/layout.js 注入 Header
 */
export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
