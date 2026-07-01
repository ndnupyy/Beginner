// ============================================================
// 文件作用：上传图片 MIME 类型识别（兼容 Windows 空 type）
// 功能对应：lib/avatar.js、lib/profileBackground.js
// 维护指引：某格式本地上传失败 → 本文件 ALLOWED_IMAGE_TYPES / resolveImageMimeType
// ============================================================

import path from "path";

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MIME_ALIASES = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png",
};

const EXT_TO_MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/**
 * 从 File/Blob 解析可靠的图片 MIME（优先 type，其次扩展名）
 * @param {{ type?: string, name?: string }} file
 * @returns {string}
 */
export function resolveImageMimeType(file) {
  const rawType = (file?.type || "").toLowerCase().trim();
  if (ALLOWED_IMAGE_TYPES.has(rawType)) {
    return rawType;
  }
  if (MIME_ALIASES[rawType]) {
    return MIME_ALIASES[rawType];
  }

  const ext = path.extname(file?.name || "").toLowerCase();
  return EXT_TO_MIME[ext] || rawType;
}

/**
 * 将 FormData 条目规范为带文件名的 File
 * @param {FormDataEntryValue|null} entry
 * @param {string} fallbackName
 * @returns {File|null}
 */
export function normalizeUploadFile(entry, fallbackName = "upload.jpg") {
  if (!entry || typeof entry === "string") {
    return null;
  }

  if (entry instanceof File) {
    return entry;
  }

  if (entry instanceof Blob) {
    const mime = resolveImageMimeType({
      type: entry.type,
      name: fallbackName,
    });
    return new File([entry], fallbackName, {
      type: mime || entry.type || "",
    });
  }

  return null;
}

/**
 * 判断 MIME 是否为允许的图片类型
 * @param {string} mime
 * @returns {boolean}
 */
export function isAllowedImageMime(mime) {
  return ALLOWED_IMAGE_TYPES.has(mime);
}
