// ============================================================
// 文件作用：头像文件保存工具
// 功能对应：注册时上传头像；独立头像上传 API
// 维护指引：
//   - 头像上传失败 / 格式不对 → 本文件 ALLOWED_TYPES、MAX_SIZE
//   - 头像 404 → public/uploads/avatars/ 目录及文件路径
//   - 注册时头像不显示 → app/api/auth/register/route.js + 本文件
// ============================================================

import fs from "fs";
import path from "path";
import {
  isAllowedImageMime,
  resolveImageMimeType,
} from "@/lib/imageMime";

// 头像保存目录（对应 URL /uploads/avatars/xxx）
const AVATAR_DIR = path.join(process.cwd(), "public", "uploads", "avatars");
// 最大 2MB
const MAX_SIZE = 2 * 1024 * 1024;
// 允许的 MIME 类型（校验逻辑见 lib/imageMime.js）
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// MIME → 文件扩展名映射
const EXT_MAP = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/**
 * 将前端传来的 base64 头像保存到磁盘（注册流程使用）
 * @param {string} base64Data - 不含 data: 前缀的 base64 字符串
 * @param {string} mimeType - 如 image/jpeg
 * @returns {string} 可访问的 URL 路径
 */
export function saveAvatarFromBase64(base64Data, mimeType) {
  if (!ALLOWED_TYPES.has(mimeType)) {
    throw new Error("仅支持 JPG、PNG、WebP、GIF 格式的头像");
  }

  const buffer = Buffer.from(base64Data, "base64");
  if (buffer.length > MAX_SIZE) {
    throw new Error("头像大小不能超过 2MB");
  }

  fs.mkdirSync(AVATAR_DIR, { recursive: true });

  const ext = EXT_MAP[mimeType] || ".jpg";
  const filename = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(AVATAR_DIR, filename);

  fs.writeFileSync(filePath, buffer);

  return `/uploads/avatars/${filename}`;
}

/**
 * 从 multipart FormData 保存头像（POST /api/auth/upload-avatar）
 * @param {File} file - 表单中的文件对象
 * @returns {Promise<string>} 可访问的 URL 路径
 */
export async function saveAvatarFromFormData(file) {
  if (!file || typeof file === "string") {
    throw new Error("请选择头像文件");
  }

  const mimeType = resolveImageMimeType(file);
  if (!isAllowedImageMime(mimeType)) {
    throw new Error("仅支持 JPG、PNG、WebP、GIF 格式的头像");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("头像大小不能超过 2MB");
  }

  fs.mkdirSync(AVATAR_DIR, { recursive: true });

  const ext = EXT_MAP[mimeType] || path.extname(file.name) || ".jpg";
  const filename = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(AVATAR_DIR, filename);

  const bytes = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, bytes);

  return `/uploads/avatars/${filename}`;
}
