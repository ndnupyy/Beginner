// ============================================================
// 文件作用：根布局组件（整个网站的"外壳"）
// 功能对应：所有页面共享的 HTML 结构、导航栏、全局样式
// 每个页面都会自动被这个 layout 包裹
// 如果导航栏不显示 / 页面结构出问题，检查这个文件
// ============================================================

// 引入全局 CSS 样式
import "./globals.css";
// 引入顶部导航栏组件
import Header from "@/components/Header";

// 页面的 metadata（标题、描述），用于 SEO 和浏览器标签页标题
export const metadata = {
  title: "简易博客 - 学习 Next.js 入门项目",
  description: "一个带详细注释的 Next.js 博客平台，适合零基础学习",
};

/**
 * RootLayout - 根布局组件
 * @param {Object} props
 *   props.children - 子页面内容（Next.js 自动传入当前页面的组件）
 * 
 * 类比 Java：类似一个 BaseController 或 Template，
 * 所有页面都共享这个外层结构（导航栏 + 内容区）
 */
export default function RootLayout({ children }) {
  return (
    // <html> 和 <body> 是整个页面的根元素
    // lang="zh-CN" 表示页面语言是简体中文
    <html lang="zh-CN">
      <body>
        {/* 顶部导航栏：每个页面都会显示 */}
        <Header />
        {/* children 是当前页面的具体内容，Next.js 会自动替换 */}
        {/* 比如访问首页时 children 就是 page.js 的内容 */}
        {children}
      </body>
    </html>
  );
}
