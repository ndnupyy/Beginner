/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 使用了原生 C++ 模块，需要告诉 Next.js 不要打包它
  // 而是在 Node.js 运行时直接加载（类似 Java 加载 .dll/.so 原生库）
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
