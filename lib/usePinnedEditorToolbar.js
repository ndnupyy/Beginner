// ============================================================
// 文件作用：写文章页编辑器功能栏固定定位（跟随编辑卡片宽度）
// 功能对应：ArticleEditor 在 embedded 模式下的工具栏
// 维护指引：顶栏高度变化 → SiteShell.css 的 --site-header-height
// ============================================================

import { useLayoutEffect, useState } from "react";

const DEFAULT_HEADER_HEIGHT = 56;
const DEFAULT_TOOLBAR_HEIGHT = 52;

/**
 * 计算功能栏固定定位参数
 * @param {DOMRect} anchorRect
 * @param {number} toolbarHeight
 * @returns {{ top: number, left: number, width: number, height: number }}
 */
function computePinnedLayout(anchorRect, toolbarHeight) {
  const siteMain = document.querySelector(".site-main");
  const headerHeight = siteMain
    ? Number.parseFloat(
        getComputedStyle(siteMain).getPropertyValue("--site-header-height")
      ) || DEFAULT_HEADER_HEIGHT
    : DEFAULT_HEADER_HEIGHT;

  return {
    top: headerHeight,
    left: Math.max(0, anchorRect.left),
    width: Math.max(0, anchorRect.width),
    height: toolbarHeight || DEFAULT_TOOLBAR_HEIGHT,
  };
}

/**
 * 写文章/编辑页：功能栏固定在顶栏下方，并随编辑卡片对齐宽度
 * @param {{ enabled: boolean, anchorRef: import('react').RefObject<HTMLElement | null>, toolbarRef: import('react').RefObject<HTMLElement | null> }} options
 * @returns {{ pinned: boolean, top: number, left: number, width: number, height: number }}
 */
export function usePinnedEditorToolbar({ enabled, anchorRef, toolbarRef }) {
  const [layout, setLayout] = useState({
    pinned: false,
    top: DEFAULT_HEADER_HEIGHT,
    left: 0,
    width: 0,
    height: DEFAULT_TOOLBAR_HEIGHT,
  });

  useLayoutEffect(() => {
    if (!enabled) {
      setLayout((current) =>
        current.pinned ? { ...current, pinned: false } : current
      );
      return undefined;
    }

    const scrollEl = document.querySelector(".site-main-body");

    function update() {
      const anchor = anchorRef?.current;
      const toolbar = toolbarRef?.current;
      if (!anchor || !toolbar) return;

      const next = computePinnedLayout(
        anchor.getBoundingClientRect(),
        toolbar.offsetHeight
      );

      setLayout({
        pinned: true,
        ...next,
      });
    }

    update();

    window.addEventListener("resize", update);
    scrollEl?.addEventListener("scroll", update, { passive: true });

    const observer = new ResizeObserver(update);
    if (anchorRef?.current) observer.observe(anchorRef.current);
    if (toolbarRef?.current) observer.observe(toolbarRef.current);

    return () => {
      window.removeEventListener("resize", update);
      scrollEl?.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [enabled, anchorRef, toolbarRef]);

  return layout;
}
