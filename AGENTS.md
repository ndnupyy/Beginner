<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:code-comment-rules -->
# 新增代码注释规范（必须遵守）

从现在开始，**所有新增或修改的代码**都必须满足以下要求：

## 1. 文件头注释（每个文件顶部）

每个文件开头必须包含：

```javascript
// ============================================================
// 文件作用：这个文件是干什么的
// 功能对应：对应界面上哪个功能 / 哪条 API
// 维护指引：出现 XX 问题时，修改本文件（可列多条）
// ============================================================
```

## 2. 逐行注释

- 每一行（或每一组紧密相关的代码）都要用中文注释说明**在做什么、为什么这样做**
- `import`、变量声明、条件判断、API 调用、返回值都要注释
- 函数上方用 JSDoc 说明参数和返回值

## 3. 维护对照

注释里要写清楚「出问题时找哪个文件」，例如：

| 问题现象 | 维护文件 |
|---|---|
| 登录失败 | `app/api/auth/login/route.js` |
| 未登录仍能进首页 | `middleware.js` |

## 4. 参考范例

现有项目中注释最完整的范例：

- `lib/db.js`
- `lib/articles.js`
- `app/api/articles/route.js`
- `components/AuthForm.js`（登录注册相关）

新增代码的注释风格必须与上述文件保持一致。
<!-- END:code-comment-rules -->
