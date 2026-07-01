"use client";
// ============================================================
// 文件作用：首页资讯头条轮播（标题叠在封面图上）
// 功能对应：导航栏下方轮播区，最多 5 条，当前有几条展示几条
// 维护指引：
//   - 数据筛选 → lib/homeHeadlines.js
//   - 样式 → HomeHeadlineCarousel.css
// ============================================================

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ArticleLink from "@/components/ArticleLink";
import "./HomeHeadlineCarousel.css";

// 大屏同时可见卡片数
const VISIBLE_COUNT_DESKTOP = 4;
// 自动轮播间隔（毫秒）
const AUTO_PLAY_MS = 4500;

/**
 * 根据屏宽计算可见卡片数量
 * @param {number} total
 * @returns {number}
 */
function getVisibleCount(total) {
  if (typeof window === "undefined") {
    return Math.min(total, VISIBLE_COUNT_DESKTOP);
  }
  if (window.innerWidth <= 640) return Math.min(total, 1);
  if (window.innerWidth <= 900) return Math.min(total, 2);
  return Math.min(total, VISIBLE_COUNT_DESKTOP);
}

/**
 * @param {{ items: { id: string, title: string, thumbnailUrl?: string, category?: string }[] }} props
 */
export default function HomeHeadlineCarousel({ items }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(
    Math.min(items.length, VISIBLE_COUNT_DESKTOP)
  );

  const maxIndex = useMemo(
    () => Math.max(0, items.length - visibleCount),
    [items.length, visibleCount]
  );

  // 监听窗口变化，调整一屏展示几张卡片
  useEffect(() => {
    function updateVisibleCount() {
      setVisibleCount(getVisibleCount(items.length));
    }

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, [items.length]);

  // 条数变少时，避免索引越界
  useEffect(() => {
    setActiveIndex((current) => Math.min(current, maxIndex));
  }, [maxIndex]);

  // 可轮播时自动切换
  useEffect(() => {
    if (items.length <= visibleCount) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current >= maxIndex ? 0 : current + 1));
    }, AUTO_PLAY_MS);

    return () => window.clearInterval(timer);
  }, [items.length, visibleCount, maxIndex]);

  if (items.length === 0) {
    return null;
  }

  const trackOffset =
    items.length > 0 ? (activeIndex * 100) / items.length : 0;

  return (
    <section className="home-headline" aria-label="资讯头条">
      <div className="home-headline-header">
        <h2 className="home-headline-title">资讯头条</h2>
        <Link href="/ranking" className="home-headline-more">
          更多资讯 &gt;
        </Link>
      </div>

      <div className="home-headline-viewport">
        <div
          className="home-headline-track"
          style={{
            transform: `translateX(-${trackOffset}%)`,
            ["--headline-visible-count"]: visibleCount,
            ["--headline-item-count"]: items.length,
          }}
        >
          {items.map((item) => (
            <ArticleLink
              key={item.id}
              href={`/article/${item.id}`}
              className="home-headline-card"
            >
              <div className="home-headline-card-media">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="home-headline-card-image"
                  />
                ) : (
                  <div
                    className="home-headline-card-placeholder"
                    aria-hidden="true"
                  />
                )}
                <div className="home-headline-card-mask" aria-hidden="true" />
                <p className="home-headline-card-title">{item.title}</p>
              </div>
            </ArticleLink>
          ))}
        </div>
      </div>

      {items.length > visibleCount && (
        <div className="home-headline-dots" role="tablist" aria-label="轮播指示">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              type="button"
              className={`home-headline-dot${
                index === activeIndex ? " home-headline-dot-active" : ""
              }`}
              aria-label={`第 ${index + 1} 屏`}
              aria-selected={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
