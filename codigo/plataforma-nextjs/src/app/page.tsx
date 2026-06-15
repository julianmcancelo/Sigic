'use client';

import dynamic from 'next/dynamic';

// Importamos el orquestador clasico de la aplicacion (App.jsx) con carga dinamica
// y desactivando el Server-Side Rendering (SSR) para prevenir errores con localStorage
// y el objeto window en el servidor de Next.js.
const AppClasico = dynamic(() => import('../App'), { ssr: false });

export default function Home() {
  return <AppClasico />;
}
