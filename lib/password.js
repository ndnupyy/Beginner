// ============================================================
// 文件作用：密码哈希与校验工具
// 功能对应：注册、登录、重置密码时的密码加密与比对
// 维护指引：
//   - 登录/注册提示密码错误 → 本文件 + 对应 API route
//   - 想更换加密算法 → 本文件（需同步迁移已有 password_hash）
// ============================================================

// 从 Node.js 内置 crypto 模块导入：scrypt 哈希、随机盐、防时序攻击比较
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

/**
 * 将明文密码转为可存储的哈希字符串
 * @param {string} password - 用户输入的明文密码
 * @returns {string} 格式为 "盐:哈希" 的字符串
 */
export function hashPassword(password) {
  // 生成 16 字节随机盐，转为十六进制字符串（每个用户唯一）
  const salt = randomBytes(16).toString("hex");
  // 用 scrypt 算法对「密码+盐」做哈希，输出 64 字节再转 hex
  const hash = scryptSync(password, salt, 64).toString("hex");
  // 盐与哈希拼在一起存入数据库，校验时可取出盐重新计算
  return `${salt}:${hash}`;
}

/**
 * 校验用户输入的密码是否与数据库存储的哈希一致
 * @param {string} password - 用户输入的明文密码
 * @param {string} storedHash - 数据库中的 password_hash 字段
 * @returns {boolean} 匹配返回 true，否则 false
 */
export function verifyPassword(password, storedHash) {
  // 从存储字符串中拆出盐和哈希两部分
  const [salt, hash] = storedHash.split(":");
  // 格式不对（旧数据或损坏）直接判定失败
  if (!salt || !hash) return false;

  // 用相同盐和算法重新计算用户输入密码的哈希
  const hashBuffer = scryptSync(password, salt, 64);
  // 将数据库中的哈希 hex 转为二进制 Buffer
  const storedBuffer = Buffer.from(hash, "hex");

  // 长度不同不可能相等，提前返回避免 timingSafeEqual 抛错
  if (hashBuffer.length !== storedBuffer.length) return false;
  // 使用恒定时间比较，降低时序攻击风险
  return timingSafeEqual(hashBuffer, storedBuffer);
}
