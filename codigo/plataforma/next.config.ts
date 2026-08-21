import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignorar errores de TypeScript en la compilacion para la migracion incremental
    ignoreBuildErrors: true,
  },
  env: {
    // Vercel inyecta VERCEL_GIT_COMMIT_SHA en build; lo exponemos al cliente
    // para mostrar version + commit en la interfaz (ver src/lib/version.ts).
    NEXT_PUBLIC_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA || '',
  },
};

export default nextConfig;
