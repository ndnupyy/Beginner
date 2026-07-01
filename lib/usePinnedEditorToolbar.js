// ============================================================
// 文件作用：写文章页编辑器功能栏视口固定（CSDN 风格，滚动始终可见）
// 功能对应：ArticleEditor embedded 模式工具栏
// 维护指引：
//   - 工具栏被遮挡 / 错位 → 本文件
//   - 样式 → components/ArticleEditor.css
// ============================================================

import { useLayoutEffect, useState } from "react";

const DEFAULT_HEADER_HEIGHT = 56;
const DEFAULT_TOOLBAR_HEIGHT = 52;

/**
 * 读取站点顶栏底边位置，作为功能栏 fixed top
 * @returns {number}
 */
function getHeaderBottom() {
  const header = document.querySelector(".header");
  if (!header) return DEFAULT_HEADER_HEIGHT;
  return Math.round(header.getBoundingClientRect().bottom);
}

/**
 * 写文章/编辑页：功能栏固定在顶栏下方，宽度跟随编辑卡片
 * @param {{
 *   enabled: boolean,
 *   anchorRef: import('react').RefObject<HTMLElement | null>,
 *   toolbarRef: import('react').RefObject<HTMLElement | null>
 * }} options
 * @returns {{ active: boolean, top: number, left: number, width: number, height: number }}
 */
export function usePinnedEditorToolbar({ enabled, anchorRef, toolbarRef }) {
  const [layout, setLayout] = useState({
    active: false,
    top: DEFAULT_HEADER_HEIGHT,
    left: 0,
    width: 0,
    height: DEFAULT_TOOLBAR_HEIGHT,
  });

  useLayoutEffect(() => {
    if (!enabled) {
      setLayout((current) =>
        current.active ? { ...current, active: false } : current
      );
      return undefined;
    }

    const scrollEl = document.querySelector(".site-main-body");

    function update() {
      const anchor = anchorRef?.current;
      const toolbar = toolbarRef?.current;
      if (!anchor || !toolbar) return;

      const anchorRect = anchor.getBoundingClientRect();

      setLayout({
        active: true,
        top: getHeaderBottom(),
        left: Math.max(0, anchorRect.left),
        width: Math.max(0, anchorRect.width),
        height: toolbar.offsetHeight || DEFAULT_TOOLBAR_HEIGHT,
      });
    }

    update();

    window.addEventListener("resize", update);
    scrollEl?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("scroll", update, { passive: true });

    const observer = new ResizeObserver(update);
    if (anchorRef?.current) observer.observe(anchorRef.current);
    if (toolbarRef?.current) observer.observe(toolbarRef.current);

    const header = document.querySelector(".header");
    if (header) observer.observe(header);

    return () => {
      window.removeEventListener("resize", update);
      scrollEl?.removeEventListener("scroll", update);
      window.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [enabled, anchorRef, toolbarRef]);

  return layout;
}
