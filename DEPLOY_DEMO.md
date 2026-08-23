# Despliegue de la demo

La demo pública se publica en `https://demo.sigic.com.ar` y debe estar completamente
aislada del entorno principal.

## Arquitectura

- Aplicación: proyecto independiente en Vercel, con directorio raíz `codigo/plataforma`.
- Base de datos: PostgreSQL/Neon exclusiva para la demo.
- DNS: registro `demo` administrado en la zona `sigic.com.ar` de Cloudflare.
- API móvil: `https://demo.sigic.com.ar/api`.

## Variables de Vercel

Configurar para Production:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
DEMO_MODE=true
NEXT_PUBLIC_DEMO_MODE=true
EMAIL_HOST=...
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=demo@sigic.com.ar
EMAIL_PASS=...
```

`JWT_SECRET` debe ser aleatorio, tener al menos 32 caracteres y ser distinto al de
cualquier otro entorno. Nunca usar la base de producción para esta demo.

## Dominio

1. Agregar `demo.sigic.com.ar` al proyecto en Vercel.
2. Crear en Cloudflare el registro indicado por Vercel, normalmente un CNAME
   `demo` hacia `cname.vercel-dns.com`.
3. Mantener el proxy de Cloudflare desactivado (DNS only) durante la validación.
4. Confirmar HTTPS y recién entonces evaluar habilitar el proxy.

## Verificación

```bash
npm ci
npm run lint
npm run build
```

Validar luego `/`, `/admin`, `/egresado`, `/api/estado`, el inicio de sesión y la
conectividad de la aplicación móvil contra el subdominio.
