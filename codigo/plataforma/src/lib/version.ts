import packageJson from '../../package.json';

/** Version semantica del proyecto (major.minor.patch), unica fuente: package.json. */
export const APP_VERSION = packageJson.version;

/**
 * Codigo de version: el hash corto del commit de GitHub que genero este build.
 * Vercel inyecta VERCEL_GIT_COMMIT_SHA en el entorno de build; next.config.ts lo
 * expone al cliente como NEXT_PUBLIC_COMMIT_SHA. Fuera de Vercel (dev local) no
 * hay valor disponible.
 */
export const BUILD_COMMIT = (process.env.NEXT_PUBLIC_COMMIT_SHA || '').slice(0, 7) || 'local';

/** Ej: "v0.1.0 · a1b2c3d" */
export const VERSION_LABEL = `v${APP_VERSION} · ${BUILD_COMMIT}`;
