// ============================================================
// 文件作用：个人主页背景图保存与读取
// 功能对应：/user/[id] 背景、文章详情页作者背景
// 维护指引：
//   - 上传失败 / 格式不对 → 本文件 ALLOWED_TYPES、MAX_SIZE
//   - 背景 404 → public/uploads/profile-backgrounds/
//   - API → app/api/auth/upload-profile-background/route.js
// ============================================================

import fs from "fs";
import path from "path";
import { getUserById } from "@/lib/users";

// 背景图保存目录（对应 URL /uploads/profile-backgrounds/xxx）
const BACKGROUND_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "profile-backgrounds"
);
// 最大 5MB
const MAX_SIZE = 5 * 1024 * 1024;
// 允许的 MIME 类型
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// MIME → 文件扩展名映射
const EXT_MAP = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/**
 * 删除已保存的背景图文件（仅允许删除本站 uploads 目录内文件）
 * @param {string} url - 如 /uploads/profile-backgrounds/xxx.jpg
 */
export function deleteProfileBackgroundFile(url) {
  if (!url || !url.startsWith("/uploads/profile-backgrounds/")) return;

  const filePath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // 删除失败不影响主流程
  }
}

/**
 * 从 multipart FormData 保存主页背景图
 * @param {File} file - 表单中的文件对象
 * @returns {Promise<string>} 可访问的 URL 路径
 */
export async function saveProfileBackgroundFromFormData(file) {
  if (!file || typeof file === "string") {
    throw new Error("请选择背景图片");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("仅支持 JPG、PNG、WebP、GIF 格式的图片");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("背景图大小不能超过 5MB");
  }

  fs.mkdirSync(BACKGROUND_DIR, { recursive: true });

  const ext = EXT_MAP[file.type] || path.extname(file.name) || ".jpg";
  const filename = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(BACKGROUND_DIR, filename);

  const bytes = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, bytes);

  return `/uploads/profile-backgrounds/${filename}`;
}

/**
 * 读取用户主页背景图 URL（无则返回空字符串）
 * @param {string} userId
 * @returns {Promise<string>}
 */
export async function getUserProfileBackgroundUrl(userId) {
  if (!userId) return "";

  const user = await getUserById(userId);
  return (user?.profileBackgroundUrl || "").trim();
}
