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

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || "file:./data/blog.db",
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

let readyPromise = null;

/** 确保示例数据已导入，返回 prisma 实例 */
export async function readyDb() {
  if (!readyPromise) {
    const { ensureSeeded } = await import("@/lib/seed");
    readyPromise = ensureSeeded();
  }
  await readyPromise;
  return prisma;
}
