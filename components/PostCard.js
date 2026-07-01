// ============================================================
// 文件作用：首页文章卡片组件（对应图一）
// 功能对应：首页每篇文章的展示（作者、标题、摘要、阅读/点赞/收藏、缩略图）
// 如果卡片内容显示不对，修改这个文件
// ============================================================

// 引入 Next.js 的 Link 组件，点击卡片跳转到文章详情页
import ArticleLink from "@/components/ArticleLink";
// 引入阅读量格式化函数（如 2900 → "2.9k"）
import { formatViews, formatCount } from "@/lib/format";
// 引入本组件的 CSS 样式
import "./PostCard.css";

/**
 * PostCard 组件 - 单篇文章卡片
 * @param {Object} props - 父组件传入的数据（类似 Java 构造函数的参数）
 *   props.article 是一篇文章的完整数据对象
 */
export default function PostCard({ article }) {
  // 从 article 对象中解构出需要的字段
  // 解构赋值：类似 Java 的 article.getTitle()，但更简洁
  const {
    id,           // 文章唯一 ID，用于生成详情页链接
    title,        // 文章标题
    summary,      // 文章摘要
    authorName,   // 作者名字
    authorAvatar, // 作者头像 URL
    thumbnailUrl, // 封面缩略图 URL
    views,        // 阅读量
    likes = 0,    // 点赞数
    favorites = 0, // 收藏数
  } = article;

  // 返回 JSX 描述卡片的外观
  return (
    // Link 包裹整个卡片，点击跳转到 /article/[id] 详情页
    // 模板字符串 `${id}` 把 ID 拼接到 URL 中
    <ArticleLink href={`/article/${id}`} className="post-card">
      {/* ===== 作者信息行 ===== */}
      <div className="post-card-author">
        {/* 作者头像：<img> 标签显示图片 */}
        <img
          src={authorAvatar}
          alt={authorName}
          className="post-card-avatar"
        />
        {/* 作者名字 */}
        <span className="post-card-author-name">{authorName}</span>
      </div>

      {/* ===== 卡片主体：左文字 + 右图片 ===== */}
      <div className="post-card-body">
        {/* 左侧文字区域 */}
        <div className="post-card-text">
          {/* 文章标题 */}
          <h2 className="post-card-title">{title}</h2>
          {/* 文章摘要：如果没有摘要，显示默认文字 */}
          <p className="post-card-summary">
            {summary || "暂无摘要"}
          </p>
          {/* 底部元信息：阅读量、点赞、收藏 */}
          <div className="post-card-meta">
            <span className="post-card-meta-item">
              👁 阅读 {formatViews(views)}
            </span>
            <span className="post-card-meta-item">
              👍 {formatCount(likes)}赞
            </span>
            <span className="post-card-meta-item">
              🔖 收藏 {formatCount(favorites)}
            </span>
          </div>
        </div>

        {/* 右侧缩略图：只有上传了封面才显示，没有封面时文字区域自动铺满 */}
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={title}
            className="post-card-thumbnail"
          />
        )}
      </div>
    </ArticleLink>
  );
}
