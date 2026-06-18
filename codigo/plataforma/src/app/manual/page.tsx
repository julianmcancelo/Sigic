'use client';

import dynamic from 'next/dynamic';

// Ruta pública estable utilizada por el QR de la credencial del manual.
const AppClasico = dynamic(() => import('../../App'), { ssr: false });

export default function PaginaManual() {
  return <AppClasico />;
}
