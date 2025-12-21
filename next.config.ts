import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Empêcher Next.js de bundler ces packages qui dépendent de modules natifs ou de dev
  serverExternalPackages: ['@whiskeysockets/baileys', 'pino', 'pino-pretty'],
};

export default nextConfig;
