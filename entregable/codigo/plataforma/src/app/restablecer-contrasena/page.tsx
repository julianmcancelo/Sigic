'use client';

import dynamic from 'next/dynamic';

const RestablecerContrasena = dynamic(() => import('../../paginas/RestablecerContrasena').then(modulo => modulo.RestablecerContrasena), { ssr: false });

export default function PaginaRestablecerContrasena() {
  return <RestablecerContrasena />;
}
