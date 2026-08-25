import type { NextConfig } from "next";

// El archivo exportado de Vercel permite probar el backend real de Neon en local
// sin volver a apuntar la interfaz a una demo remota que puede estar desactualizada.
if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile('.env.local.production');
  } catch {
    // En Vercel este archivo no existe: las variables llegan desde el entorno.
  }
}

const apiRemotaDesarrollo = process.env.DATABASE_URL
  ? undefined
  : process.env.SIGIC_REMOTE_API_ORIGIN?.replace(/\/$/, '');

const nextConfig: NextConfig = {
  // PDFKit resuelve las fuentes AFM en tiempo de ejecución. Mantenerlo externo
  // hace que Vercel empaquete el módulo completo, incluidos esos archivos.
  serverExternalPackages: ['pdfkit'],
  outputFileTracingIncludes: {
    '/api/[...slug]': ['./node_modules/pdfkit/js/data/**/*'],
  },
  async rewrites() {
    const descargas = {
      source: '/',
      has: [{ type: 'host' as const, value: 'descargas.sigic.com.ar' }],
      destination: '/descargas',
    };

    if (!apiRemotaDesarrollo) return [descargas];

    // Permite probar la UI local con el entorno demo sin copiar secretos de Neon.
    return {
      beforeFiles: [{
        source: '/api/:path*',
        destination: `${apiRemotaDesarrollo}/api/:path*`,
      }],
      afterFiles: [descargas],
    };
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
