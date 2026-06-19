'use client';

import dynamic from 'next/dynamic';

// Ruta de acceso administrativo directo
const AppClasico = dynamic(() => import('../../App'), { ssr: false });

export default function PaginaAdminDirecto() {
  return <AppClasico />;
}
