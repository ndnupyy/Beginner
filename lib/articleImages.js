// ============================================================
// 文件作用：文章正文图片保存工具
// 功能对应：编辑器本地上传插入图片
// ============================================================

import fs from "fs";
import path from "path";

const IMAGE_DIR = path.join(process.cwd(), "public", "uploads", "articles");
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_MAP = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/** 从 multipart FormData 保存文章图片 */
export async function saveArticleImageFromFormData(file) {
  if (!file || typeof file === "string") {
    throw new Error("请选择图片文件");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("仅支持 JPG、PNG、WebP、GIF 格式的图片");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("图片大小不能超过 5MB");
  }

  fs.mkdirSync(IMAGE_DIR, { recursive: true });

  const ext = EXT_MAP[file.type] || path.extname(file.name) || ".jpg";
  const filename = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(IMAGE_DIR, filename);

  const bytes = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, bytes);

  return `/uploads/articles/${filename}`;
}
