// ============================================================
// 文件作用：主页背景展示（cover 铺满容器）
// 功能对应：components/PageBackground.js、UserProfilePanel 顶栏横幅
// 维护指引：个人主页 / 文章页整页 cover 背景 → components/PageBackground.js
// ============================================================

/**
 * 预加载图片并读取原始像素尺寸
 * @param {string} url
 * @returns {Promise<{ naturalWidth: number, naturalHeight: number }|null>}
 */
export function loadImageDimensions(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      resolve({
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * 将背景样式应用到 DOM 元素（cover 铺满）
 * @param {HTMLElement} element
 * @param {string} url
 * @param {"cover"} mode
 */
export function applyBackgroundToElement(element, url, mode = "cover") {
  element.classList.remove("author-bg--cover");
  if (mode === "cover") {
    element.classList.add("author-bg--cover");
  }
  element.style.setProperty("--author-page-bg", `url("${url}")`);
}

/**
 * 清除元素上的自定义背景
 * @param {HTMLElement} element
 */
export function clearBackgroundFromElement(element) {
  element.classList.remove("author-bg--cover");
  element.style.removeProperty("--author-page-bg");
}
