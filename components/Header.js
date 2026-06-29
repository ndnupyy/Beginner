// ============================================================
// 文件作用：顶部导航栏组件
// 功能对应：每个页面顶部的导航栏（Logo + 写文章按钮）
// 如果导航栏文字/链接/按钮出问题，修改这个文件
// ============================================================

// 引入 Next.js 的 Link 组件（用于页面间跳转，不会整页刷新）
import Link from "next/link";
// 引入本组件的 CSS 样式文件
import "./Header.css";

/**
 * Header 组件 - 顶部导航栏
 * 这是一个"函数组件"，在 React 中，组件就是一个返回 JSX 的函数
 * JSX 类似 HTML，但写在 JavaScript 里
 */
export default function Header() {
  // return 后面是 JSX，描述页面上要显示什么
  return (
    // <header> 是 HTML5 语义化标签，表示页面头部
    <header className="header">
      {/* 内部容器，用于限制宽度和布局 */}
      <div className="header-inner">
        {/* Link 组件：点击跳转到首页 "/"，类似 HTML 的 <a href="/"> */}
        <Link href="/" className="header-logo">
          简易博客
        </Link>
        {/* 点击跳转到写文章页面 "/write" */}
        <Link href="/write" className="header-write-btn">
          写文章
        </Link>
      </div>
    </header>
  );
}
