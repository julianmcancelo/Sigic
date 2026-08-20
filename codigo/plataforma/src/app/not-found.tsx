'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function PaginaNoEncontrada() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [silenciado, setSilenciado] = useState(false);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      audioRef.current?.play().catch(() => {
        // El navegador bloqueó el autoplay hasta que haya interacción del usuario.
      });
    }, 2700);
    return () => clearTimeout(temporizador);
  }, []);

  function alternarSonido() {
    if (!audioRef.current) return;
    audioRef.current.muted = !audioRef.current.muted;
    setSilenciado(audioRef.current.muted);
    if (!audioRef.current.muted) {
      audioRef.current.play().catch(() => {});
    }
  }

  return (
    <main className="homer-404">
      <audio ref={audioRef} src="/404/backsound.mp3" loop />

      <div className="homer-cortina homer-cortina-izq">
        <img src="/404/izq.png" alt="" />
      </div>
      <div className="homer-cortina homer-cortina-der">
        <img src="/404/der.png" alt="" />
      </div>

      <h1 className="homer-title">Homer&apos;s 404 Page</h1>
      <p className="homer-subtitle">Esta página se perdió camino a la planta nuclear.</p>

      <div className="homer-parent">
        <div className="homer-div1"><img src="/404/jesus.gif" alt="" width={270} /></div>
        <div className="homer-div2"><img src="/404/reloj.gif" alt="" width={80} /></div>
        <div className="homer-div3"><img src="/404/worm.gif" alt="" width={100} /></div>
        <div className="homer-div4"><img src="/404/toaster.gif" alt="" width={90} /></div>
        <div className="homer-div5"><img src="/404/mouth.gif" alt="" width={130} /></div>
        <div className="homer-div6"><img src="/404/toaster.gif" alt="" width={125} /></div>
        <div className="homer-div7"><img src="/404/ring.gif" alt="" width={70} /></div>
        <div className="homer-div8"><img src="/404/reloj.gif" alt="" width={120} /></div>
        <div className="homer-div9"><img src="/404/worm.gif" alt="" width={100} /></div>
        <div className="homer-div10"><img src="/404/reloj.gif" alt="" width={70} /></div>
        <div className="homer-div11"><img src="/404/toaster.gif" alt="" width={120} /></div>
        <div className="homer-div12"><img src="/404/ring.gif" alt="" width={100} /></div>
        <div className="homer-div13"><img src="/404/mouth.gif" alt="" width={130} /></div>
        <div className="homer-div14"><img src="/404/worm.gif" alt="" width={100} /></div>
        <div className="homer-div15"><img src="/404/toaster.gif" alt="" width={70} /></div>
      </div>

      <div className="homer-parent-mobile">
        <section>
          <div className="homer-div-mobile"><img src="/404/reloj.gif" alt="" /></div>
          <div className="homer-div-mobile"><img src="/404/mouth.gif" alt="" /></div>
          <div className="homer-div-mobile"><img src="/404/ring.gif" alt="" /></div>
          <div className="homer-div-mobile"><img src="/404/worm.gif" alt="" /></div>
          <div className="homer-div-mobile"><img src="/404/mouth.gif" alt="" /></div>
        </section>
        <section>
          <div className="homer-div1-mobile"><img src="/404/jesus.gif" alt="" /></div>
        </section>
        <section>
          <div className="homer-div-mobile"><img src="/404/reloj.gif" alt="" /></div>
          <div className="homer-div-mobile"><img src="/404/ring.gif" alt="" /></div>
          <div className="homer-div-mobile"><img src="/404/toaster.gif" alt="" /></div>
          <div className="homer-div-mobile"><img src="/404/worm.gif" alt="" /></div>
          <div className="homer-div-mobile"><img src="/404/ring.gif" alt="" /></div>
        </section>
      </div>

      <div className="homer-actions">
        <Link href="/">Volver a SiGIC</Link>
        <Link href="/egresado" className="secondary">Acceso de egresados</Link>
      </div>

      <button type="button" onClick={alternarSonido} className="homer-mute" aria-label={silenciado ? 'Activar sonido' : 'Silenciar sonido'}>
        <img src="/404/muted.png" alt="" />
      </button>

      <p className="homer-credito">
        Diseño original de la Homer&apos;s Web Page:{' '}
        <a href="https://github.com/franciscominen/homers-web-page" target="_blank" rel="noreferrer">
          github.com/franciscominen
        </a>
      </p>
    </main>
  );
}
