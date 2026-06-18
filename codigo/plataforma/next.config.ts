import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignorar errores de TypeScript en la compilacion para la migracion incremental
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
