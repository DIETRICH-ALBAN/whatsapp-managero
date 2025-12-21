import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Empêcher Next.js de bundler ces packages qui dépendent de modules natifs ou de dev
  serverExternalPackages: ['@whiskeysockets/baileys', 'pino', 'pino-pretty'],

  webpack: (config) => {
    // Ignorer les modules qui causent des erreurs de build mais ne sont pas critiques pour le runtime
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
      'sharp': 'commonjs sharp',
      'onnxruntime-node': 'commonjs onnxruntime-node',
    })
    return config
  },
};

export default nextConfig;
