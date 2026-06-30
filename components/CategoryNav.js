"use client";
// ============================================================
// 文件作用：首页分类专栏导航（CSDN 风格横向标签栏）
// 功能对应：展示已发布文章的分类，点击筛选对应专栏文章
// 维护指引：
//   - 样式 → CategoryNav.css
//   - 筛选逻辑 → ArticleSearchList.js（URL 参数 category）
//   - 分类数据来源 → 发布文章时 ArticleSettings 的「分类专栏」字段
// ============================================================

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildHomeUrl } from "@/lib/homeUrl";
import "./CategoryNav.css";

export default function CategoryNav({ articles }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = (searchParams.get("category") || "").trim();

  const categories = useMemo(() => {
    const names = new Set();
    for (const article of articles) {
      const name = article.category?.trim();
      if (name) names.add(name);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }, [articles]);

  if (categories.length === 0) return null;

  function handleSelect(category) {
    router.push(buildHomeUrl(searchParams, { category }));
  }

  return (
    <div className="category-nav">
      <div className="category-nav-scroll">
        <button
          type="button"
          className={`category-nav-item${
            !activeCategory ? " category-nav-item-active" : ""
          }`}
          onClick={() => handleSelect("")}
        >
          全部
        </button>

        {categories.map((name) => (
          <button
            key={name}
            type="button"
            className={`category-nav-item${
              activeCategory === name ? " category-nav-item-active" : ""
            }`}
            onClick={() => handleSelect(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <span className="category-nav-more" aria-hidden="true">
        ›
      </span>
    </div>
  );
}
