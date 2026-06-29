# 简易博客平台 - Next.js 入门学习项目

> 这是一个专为零基础新手设计的博客项目，每一行代码都有中文注释。
> 你只需要会一点 HTML、CSS、Java，就能通过这个项目入门 Next.js 和 React。

---

## 快速启动

```bash
# 1. 进入项目目录
cd d:\demo1

# 2. 安装依赖（首次运行需要，如果已经安装可跳过）
npm install

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器访问
# http://localhost:3000
```

---

## 功能 → 代码文件对照表

> **这是最重要的部分！** 当你看到某个功能出问题时，直接找对应的文件修改。

| 你看到的界面/功能 | 对应文件 | 说明 |
|---|---|---|
| **顶部导航栏**（Logo + 写文章） | `components/Header.js` + `components/Header.css` | 点击 Logo 回首页并清除搜索 |
| **返回首页链接** | `components/BackToHome.js` + `components/BackToHome.css` | 写文章、编辑、详情页顶部的「← 返回首页」 |
| **首页文章列表**（图一卡片） | `app/page.js` | 首页路由 |
| **首页标题搜索** | `components/ArticleSearchList.js` | 搜索框 + 按标题过滤 |
| **单篇文章卡片**（作者/标题/摘要/阅读量/缩略图） | `components/PostCard.js` + `components/PostCard.css` | 首页每篇文章的展示 |
| **文章详情页**（查看完整文章） | `app/article/[id]/page.js` | 点击卡片后进入 |
| **编辑/删除按钮** | `components/ArticleActions.js` | 详情页底部 |
| **写文章 - 第1步**（标题+正文，图二） | `components/ArticleEditor.js` + `components/ArticleEditor.css` | 标题字数验证也在此 |
| **写文章 - 第2步**（标签/封面/摘要等，图三） | `components/ArticleSettings.js` + `components/ArticleSettings.css` | 发布设置表单 |
| **写文章/编辑文章单页表单** | `components/ArticleForm.js` | 编辑内容 + 发布设置在同一页，滚动切换 |
| **发布文章页面** | `app/write/page.js` | 访问 /write |
| **编辑文章页面** | `app/edit/[id]/page.js` | 访问 /edit/文章ID |
| **全局样式**（背景色/字体/通用布局） | `app/globals.css` | 全站通用样式 |
| **网站整体外壳**（导航栏+页面结构） | `app/layout.js` | 所有页面的父容器 |

### 后端 / 数据层

| 功能 | 对应文件 | 说明 |
|---|---|---|
| **SQLite 数据库连接与建表** | `lib/db.js` | 数据库文件、表结构、首次导入示例数据 |
| **文章数据存储** | `data/blog.db` | SQLite 数据库文件（运行时自动生成） |
| **示例数据（仅首次导入用）** | `data/articles.json` | 首次启动时若数据库为空，会导入这里的示例 |
| **数据读写逻辑**（增删改查核心） | `lib/articles.js` | 类似 Java 的 Service 层，操作 SQLite |

### SQLite 数据库表结构（articles 表）

| 数据库字段 | 对应发布表单 | 说明 |
|---|---|---|
| `title` | 文章标题（图二） | 5~100 字 |
| `content` | 文章正文（图二） | 正文内容 |
| `tags` | 文章标签（图三） | JSON 字符串存储数组 |
| `thumbnail_url` | 封面图（图三） | 支持 URL 或 base64 |
| `summary` | 文章摘要（图三） | 最多 256 字 |
| `category` | 分类专栏（图三） | 分类名称 |
| `article_type` | 文章类型（图三） | 原创 / 转载 / 翻译 |
| `visibility` | 可见范围（图三） | 全部可见 / 仅我可见 |
| `author_name` | 作者名 | 默认"博客作者" |
| `author_avatar` | 作者头像 | 默认 `/default-avatar.svg` |
| `views` | 阅读量 | 每次查看详情 +1 |
| `created_at` / `updated_at` | — | 创建/更新时间 |

> 数据库文件路径：`data/blog.db`（首次启动自动生成，并从 `articles.json` 导入示例数据）
| **API：获取列表 + 创建文章** | `app/api/articles/route.js` | GET / POST |
| **API：查单篇 + 改 + 删** | `app/api/articles/[id]/route.js` | GET / PUT / DELETE |

---

## 项目目录结构

```
d:\demo1\
├── app/                          ← 页面和 API（Next.js App Router）
│   ├── layout.js                 ← 全站布局（导航栏）
│   ├── page.js                   ← 首页（文章列表）
│   ├── globals.css               ← 全局 CSS 样式
│   ├── write/
│   │   └── page.js               ← 发布文章页
│   ├── edit/
│   │   └── [id]/
│   │       └── page.js           ← 编辑文章页
│   ├── article/
│   │   └── [id]/
│   │       ├── page.js           ← 文章详情页
│   │       └── not-found.js      ← 404 页面
│   └── api/
│       └── articles/
│           ├── route.js          ← 列表 + 创建 API
│           └── [id]/
│               └── route.js      ← 单篇查/改/删 API
├── components/                   ← 可复用的 UI 组件
│   ├── Header.js / .css          ← 导航栏
│   ├── PostCard.js / .css        ← 文章卡片（图一）
│   ├── ArticleEditor.js / .css   ← 编辑器（图二）
│   ├── ArticleSettings.js / .css ← 设置表单（图三）
│   └── ArticleActions.js         ← 编辑/删除按钮
├── lib/
│   ├── db.js                     ← SQLite 连接与建表
│   └── articles.js               ← 数据读写（Service 层）
├── data/
│   ├── blog.db                   ← SQLite 数据库（运行后自动生成）
│   └── articles.json             ← 示例数据（首次导入用）
└── public/
    └── default-avatar.svg        ← 默认头像
```

---

## 核心概念解释（给 Java 开发者）

### 1. 组件 (Component) = Java 的类

```javascript
// React 组件就是一个函数，返回 HTML（叫 JSX）
export default function PostCard({ article }) {
  return <div>{article.title}</div>;
}
```

类比 Java：就像一个 `PostCard` 类，构造函数接收 `article` 参数，render 方法返回 HTML。

### 2. JSX = HTML + JavaScript

```javascript
// JSX 里可以用 {} 嵌入 JavaScript 表达式
<h2>{article.title}</h2>
{articles.map(a => <PostCard key={a.id} article={a} />)}
```

### 3. useState = 成员变量 + setter

```javascript
const [title, setTitle] = useState("");
// title 是当前值，setTitle("新标题") 会更新值并刷新页面
```

类比 Java：`private String title;` + `setTitle(String t) { this.title = t; repaint(); }`

### 4. 服务端组件 vs 客户端组件

- **服务端组件**（默认）：在服务器运行，可以直接读文件。如 `app/page.js`
- **客户端组件**（文件顶部加 `"use client"`）：在浏览器运行，可以响应用户点击/输入。如 `ArticleEditor.js`

### 5. API 路由 = Spring Boot 的 Controller

```javascript
// app/api/articles/route.js
export async function GET() { ... }   // 类似 @GetMapping
export async function POST() { ... }  // 类似 @PostMapping
```

### 6. 文件路由 = URL 映射

Next.js 根据 `app/` 下的文件夹结构自动生成 URL：

| 文件路径 | 访问 URL |
|---|---|
| `app/page.js` | `/` |
| `app/write/page.js` | `/write` |
| `app/article/[id]/page.js` | `/article/任意ID` |
| `app/api/articles/route.js` | `/api/articles` |

---

## CRUD 操作流程

### 增 (Create) - 发布文章
```
用户填写表单 → app/write/page.js
  → 第1步 ArticleEditor（标题+内容）
  → 第2步 ArticleSettings（标签+封面+摘要等）
  → POST /api/articles → app/api/articles/route.js
  → lib/articles.js 的 createArticle()
  → 写入 SQLite 数据库 data/blog.db
```

### 查 (Read) - 查看文章
```
首页列表：app/page.js → lib/articles.js 的 getAllArticles()
文章详情：app/article/[id]/page.js → getArticleById() + incrementViews()
```

### 改 (Update) - 编辑文章
```
点击"编辑" → app/edit/[id]/page.js
  → 加载已有数据填充表单
  → PUT /api/articles/[id] → app/api/articles/[id]/route.js
  → lib/articles.js 的 updateArticle()
```

### 删 (Delete) - 删除文章
```
点击"删除" → components/ArticleActions.js
  → DELETE /api/articles/[id]
  → lib/articles.js 的 deleteArticle()
  → 跳转回首页
```

---

## 常见问题排查

| 问题 | 检查哪里 |
|---|---|
| 首页看不到文章 | `data/blog.db` 是否存在？`lib/db.js` 和 `lib/articles.js` 是否正常？ |
| 发布按钮点了没反应 | `app/write/page.js` 的 handlePublish 函数 |
| 标题字数提示不对 | `components/ArticleEditor.js` 的 MIN_TITLE_LENGTH |
| 卡片样式不对 | `components/PostCard.css` |
| 编辑器样式不对 | `components/ArticleEditor.css` |
| 设置表单样式不对 | `components/ArticleSettings.css` |
| 删除失败 | `components/ArticleActions.js` 和 `app/api/articles/[id]/route.js` |
| 404 页面 | `app/article/[id]/not-found.js` |

---

## 学习路线建议

1. **先看** `app/layout.js` 和 `app/page.js` —— 理解页面结构
2. **再看** `components/PostCard.js` —— 理解组件和 JSX
3. **然后看** `components/ArticleEditor.js` —— 理解 useState 和用户交互
4. **接着看** `app/write/page.js` —— 理解多步骤流程
5. **最后看** `lib/articles.js` 和 `app/api/` —— 理解数据层和 API

祝你学习愉快！
