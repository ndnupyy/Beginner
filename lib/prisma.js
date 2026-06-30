// ============================================================
// 文件作用：Prisma Client 单例（Next.js 热重载安全）
// 功能对应：全项目统一的数据库访问入口
// 维护指引：
//   - 连接失败 → .env 的 DATABASE_URL、prisma.config.ts
//   - Client 未生成 → npx prisma generate
//   - SQLite 适配器 → @prisma/adapter-better-sqlite3
// ============================================================

import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis;

/** schema 变更后递增，用于开发环境丢弃旧 Client 缓存 */
const PRISMA_CLIENT_VERSION = 2;

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || "file:./data/blog.db",
  });
  return new PrismaClient({ adapter });
}

function isStaleClient(cached) {
  if (!cached) return true;
  if (globalForPrisma.__prismaClientVersion !== PRISMA_CLIENT_VERSION) {
    return true;
  }
  if (typeof cached.article_reactions?.findMany !== "function") {
    return true;
  }
  return false;
}

/** 开发环境热重载后，旧 Client 可能缺少新字段/模型，需重建 */
function getPrismaClient() {
  if (process.env.NODE_ENV !== "production") {
    if (isStaleClient(globalForPrisma.prisma)) {
      globalForPrisma.prisma = createPrismaClient();
      globalForPrisma.__prismaClientVersion = PRISMA_CLIENT_VERSION;
    }
    return globalForPrisma.prisma;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();

let readyPromise = null;

/** 确保示例数据已导入，返回 prisma 实例 */
export async function readyDb() {
  if (!readyPromise) {
    const { ensureSeeded } = await import("@/lib/seed");
    readyPromise = ensureSeeded();
  }
  await readyPromise;
  return getPrismaClient();
}
