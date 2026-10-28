'use client';

import dynamic from 'next/dynamic';

const ManualUsuarioWeb = dynamic(
  () => import('../../paginas/ManualUsuarioWeb').then((mod) => mod.ManualUsuarioWeb),
  { ssr: false }
);

export default function PaginaManual() {
  return <ManualUsuarioWeb onVolver={() => { window.location.href = '/'; }} />;
}
