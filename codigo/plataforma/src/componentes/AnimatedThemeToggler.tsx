import React, { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

export type ThemeSwitchSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AnimatedThemeTogglerProps extends Omit<React.LabelHTMLAttributes<HTMLLabelElement>, 'onChange'> {
  /** Duración de la onda expansiva circular (View Transition) en ms. Default: 450 */
  duration?: number;
  /** Escala predefinida ('sm' | 'md' | 'lg' | 'xl'). Default: 'md' */
  size?: ThemeSwitchSize;
  /** Clave en localStorage donde se guarda 'dark' | 'light' o el fondo. Default: 'sigic_tema' */
  storageKey?: string;
  /** Modo controlado opcional (true = noche/oscuro, false = día/claro) */
  isDark?: boolean;
  /** Callback disparado al cambiar entre claro y oscuro */
  onThemeChange?: (isDark: boolean) => void;
  /** Activa o desactiva la onda circular View Transition. Default: true */
  enableViewTransition?: boolean;
}

const INJECTED_STYLE_ID = 'sigic-animated-theme-toggler-styles';

const CSS_CONTENT = `
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}
.sigic-theme-switch {
  font-size: 14px;
  position: relative;
  display: inline-block;
  width: 3.5em;
  height: 2em;
  cursor: pointer;
  flex-shrink: 0;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  vertical-align: middle;
}
.sigic-theme-switch--sm { font-size: 11px; }
.sigic-theme-switch--md { font-size: 13px; }
.sigic-theme-switch--lg { font-size: 17px; }
.sigic-theme-switch--xl { font-size: 22px; }
.sigic-theme-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
  pointer-events: none;
}
.sigic-theme-switch .slider {
  --background: #101c2b;
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: var(--background);
  transition: background-color 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 30px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.12);
}
.sigic-theme-switch .slider::before {
  position: absolute;
  content: "";
  height: 1.4em;
  width: 1.4em;
  border-radius: 50%;
  left: 10%;
  bottom: 15%;
  box-shadow: inset 8px -4px #ececd9, -3px 1px 3px #dadada;
  background: var(--background);
  transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.45s cubic-bezier(0.4, 0, 0.2, 1), background 0.45s ease;
  z-index: 2;
}
.sigic-theme-switch .decoration {
  position: absolute;
  content: "";
  height: 2px;
  width: 2px;
  border-radius: 50%;
  right: 22%;
  top: 18%;
  background: #e5f041e6;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  transition: all 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  box-shadow:
    -7px 10px #e5f041e6,
    8px 15px #e5f041e6,
    -17px 1px #e5f041e6,
    -20px 10px #e5f041e6,
    -7px 23px #e5f041e6,
    -15px 25px #e5f041e6;
  z-index: 1;
}

/* Modo Claro (Checked = Sol y Nubes de día) */
.sigic-theme-switch input:checked ~ .decoration {
  transform: translate(-18px, -2px);
  width: 10px;
  height: 10px;
  background: #ffffff;
  box-shadow:
    -12px 0 #ffffff,
    -6px 0 0 1.6px #ffffff,
    5px 15px 0 1px #ffffff,
    1px 17px #ffffff,
    10px 17px #ffffff;
}
.sigic-theme-switch input:checked + .slider {
  background-color: #38bdf8;
  box-shadow: inset 0 2px 4px rgba(2, 132, 199, 0.3), 0 0 0 1px rgba(14, 165, 233, 0.4);
}
.sigic-theme-switch input:checked + .slider::before {
  transform: translate(105%);
  background: #facc15;
  box-shadow: inset 15px -4px 0 15px #fde047, 0 0 12px #facc15;
}

.sigic-theme-switch .sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
`;

function ensureStylesInjected(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(INJECTED_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = INJECTED_STYLE_ID;
  style.textContent = CSS_CONTENT;
  document.head.appendChild(style);
}

/**
 * AnimatedThemeToggler para SiGIC.
 * Soporta animación circular con la View Transitions API y es compatible
 * tanto con la alternancia día/noche (claro/oscuro) como con la paleta de 10 fondos Beltrán.
 */
export const AnimatedThemeToggler: React.FC<AnimatedThemeTogglerProps> = ({
  className = '',
  duration = 450,
  size = 'md',
  storageKey = 'sigic_tema',
  isDark: controlledDark,
  onThemeChange,
  enableViewTransition = true,
  ...props
}) => {
  const [internalDark, setInternalDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const fondo = localStorage.getItem('sigic_fondo');
    if (fondo === 'alabaster' || fondo === 'original') return false;
    const guardado = localStorage.getItem('sigic_tema');
    if (guardado) return guardado === 'oscuro';
    return true; // Por defecto oscuro (Azul Beltrán oficial)
  });

  const labelRef = useRef<HTMLLabelElement | null>(null);

  const isDark = controlledDark !== undefined ? controlledDark : internalDark;

  useEffect(() => {
    ensureStylesInjected();
  }, []);

  // Sincronizar en vivo si el tema cambia desde otros componentes o modales
  useEffect(() => {
    const handleFondoCambiado = (e: any) => {
      const nuevoFondo = e.detail;
      const esClaro = nuevoFondo === 'alabaster' || nuevoFondo === 'original';
      setInternalDark(!esClaro);
    };

    const handleTemaCambiado = (e: any) => {
      if (typeof e.detail === 'boolean') {
        setInternalDark(e.detail);
      } else if (e.detail === 'claro' || e.detail === 'oscuro') {
        setInternalDark(e.detail === 'oscuro');
      }
    };

    window.addEventListener('sigic-fondo-cambiado', handleFondoCambiado);
    window.addEventListener('sigic-tema-cambiado', handleTemaCambiado);
    return () => {
      window.removeEventListener('sigic-fondo-cambiado', handleFondoCambiado);
      window.removeEventListener('sigic-tema-cambiado', handleTemaCambiado);
    };
  }, []);

  const applyTheme = useCallback(
    (nextDark: boolean) => {
      if (controlledDark === undefined) {
        setInternalDark(nextDark);
        try {
          localStorage.setItem(storageKey, nextDark ? 'oscuro' : 'claro');
        } catch {}

        // Sincronizar con el fondo adecuado si es necesario
        const fondoActual = localStorage.getItem('sigic_fondo') || 'beltran';
        let nuevoFondo = fondoActual;
        if (!nextDark && (fondoActual !== 'alabaster' && fondoActual !== 'original')) {
          // Cambiando a claro: pasar a alabaster o preservar original
          nuevoFondo = 'alabaster';
        } else if (nextDark && (fondoActual === 'alabaster' || fondoActual === 'original')) {
          // Cambiando a oscuro: volver a Beltrán oficial
          const ultimoOscuro = localStorage.getItem('sigic_ultimo_fondo_oscuro') || 'beltran';
          nuevoFondo = ultimoOscuro;
        }

        if (nuevoFondo !== fondoActual) {
          localStorage.setItem('sigic_fondo', nuevoFondo);
          window.dispatchEvent(new CustomEvent('sigic-fondo-cambiado', { detail: nuevoFondo }));
        }

        window.dispatchEvent(new CustomEvent('sigic-tema-cambiado', { detail: nextDark ? 'oscuro' : 'claro' }));
      }
      onThemeChange?.(nextDark);
    },
    [controlledDark, onThemeChange, storageKey],
  );

  const toggleTheme = useCallback(async () => {
    if (!labelRef.current) return;
    const nextDark = !isDark;

    const docWithVT = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };

    const canAnimate =
      enableViewTransition &&
      typeof docWithVT.startViewTransition === 'function' &&
      window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

    if (!canAnimate) {
      applyTheme(nextDark);
      return;
    }

    try {
      await docWithVT.startViewTransition!(() => {
        flushSync(() => {
          applyTheme(nextDark);
        });
      }).ready;

      const { top, left, width, height } = labelRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const maxRadius = Math.hypot(
        Math.max(left, window.innerWidth - left),
        Math.max(top, window.innerHeight - top),
      );

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${centerX}px ${centerY}px)`,
            `circle(${maxRadius}px at ${centerX}px ${centerY}px)`,
          ],
        },
        {
          duration,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    } catch {
      applyTheme(nextDark);
    }
  }, [isDark, enableViewTransition, applyTheme, duration]);

  const sizeClass = size !== 'md' ? `sigic-theme-switch--${size}` : '';

  return (
    <label
      ref={labelRef}
      className={`sigic-theme-switch ${sizeClass} ${className}`.trim()}
      aria-label={isDark ? 'Cambiar a modo diurno (claro)' : 'Cambiar a modo nocturno (oscuro)'}
      title={isDark ? 'Cambiar a modo diurno' : 'Cambiar a modo nocturno'}
      onClick={(e) => {
        e.preventDefault();
        void toggleTheme();
      }}
      {...props}
    >
      <input
        type="checkbox"
        checked={!isDark}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
      />
      <span className="slider" />
      <span className="decoration" />
      <span className="sr-only">Alternar tema día/noche</span>
    </label>
  );
};

export default AnimatedThemeToggler;
