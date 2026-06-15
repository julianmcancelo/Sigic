import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignorar errores de TypeScript en la compilacion para la migracion incremental
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignorar advertencias de ESLint en la compilacion
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
