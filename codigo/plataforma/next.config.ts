import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDFKit resuelve las fuentes AFM en tiempo de ejecución. Mantenerlo externo
  // hace que Vercel empaquete el módulo completo, incluidos esos archivos.
  serverExternalPackages: ['pdfkit'],
  outputFileTracingIncludes: {
    '/api/[...slug]': ['./node_modules/pdfkit/js/data/**/*'],
  },
  async rewrites() {
    return [
      {
        source: '/',
        has: [{ type: 'host', value: 'descargas.sigic.com.ar' }],
        destination: '/descargas',
      },
    ];
  },
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
