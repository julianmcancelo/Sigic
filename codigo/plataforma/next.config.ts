import type { NextConfig } from "next";
import { execSync } from "child_process";

let commitSha = process.env.VERCEL_GIT_COMMIT_SHA || '';
if (!commitSha) {
  try {
    commitSha = execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    commitSha = 'local';
  }
}

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

const directivaScripts = process.env.NODE_ENV === 'production'
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

const nextConfig: NextConfig = {
  // En Vercel no se debe usar 'standalone' porque Vercel Serverless gestiona su propio tracing nativo.
  // 'standalone' se utiliza para compilar el appliance OS local o Docker.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  poweredByHeader: false,

  async redirects() {
    return [
      {
        source: '/descargas/SIGIC-Porteria-1.0.9.apk',
        destination: 'https://github.com/julianmcancelo/Sigic/releases/latest/download/SIGIC-Porteria-Release-v1.0.9.apk',
        permanent: false,
      },
      {
        source: '/descargas/porteria-apk',
        destination: 'https://github.com/julianmcancelo/Sigic/releases/latest/download/SIGIC-Porteria-Release-v1.0.9.apk',
        permanent: false,
      },
      {
        source: '/descargas/porteria-apk-latest',
        destination: 'https://github.com/julianmcancelo/Sigic/releases/latest/download/SIGIC-Porteria-Release-v1.0.9.apk',
        permanent: false,
      },
    ];
  },

  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self)' },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        { key: 'Content-Security-Policy', value: `default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ${directivaScripts}; connect-src 'self' https:; form-action 'self'; upgrade-insecure-requests` },
      ],
    }];
  },
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
    // Vercel inyecta VERCEL_GIT_COMMIT_SHA en build; en local se toma de git.
    NEXT_PUBLIC_COMMIT_SHA: commitSha,
  },
};

export default nextConfig;
