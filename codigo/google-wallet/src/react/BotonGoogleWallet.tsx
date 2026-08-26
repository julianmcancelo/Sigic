import React from 'react';

export interface PropsBotonGoogleWallet extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** URL generada de Google Wallet (pay.google.com/gp/v/save/...) */
  url?: string;
  /** Callback al hacer click si se maneja de forma asíncrona */
  alHacerClick?: () => void | Promise<void>;
  /** Texto del botón. Por defecto: "Guardar en Google Wallet" */
  texto?: string;
  /** Tema visual del botón ('oscuro' | 'claro'). Por defecto: 'oscuro' */
  tema?: 'oscuro' | 'claro';
  /** Si está en estado de carga */
  cargando?: boolean;
}

export const BotonGoogleWallet: React.FC<PropsBotonGoogleWallet> = ({
  url,
  alHacerClick,
  texto = 'Guardar en Google Wallet',
  tema = 'oscuro',
  cargando = false,
  className = '',
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || cargando) {
      e.preventDefault();
      return;
    }
    if (alHacerClick) {
      alHacerClick();
    } else if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const esOscuro = tema === 'oscuro';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || cargando}
      aria-label={texto}
      className={`
        inline-flex items-center justify-center gap-3 px-5 py-3 rounded-full font-medium text-xs
        transition-all duration-200 cursor-pointer select-none active:scale-98
        ${esOscuro 
          ? 'bg-[#1F1F1F] hover:bg-[#2B2B2B] text-white border border-[#3C4043] shadow-md' 
          : 'bg-white hover:bg-slate-50 text-[#1F1F1F] border border-[#DADCE0] shadow-sm'}
        ${disabled || cargando ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        ${className}
      `.trim()}
      {...props}
    >
      {/* Icono Oficial de Google Wallet */}
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M40 12H8C5.79 12 4.02 13.79 4.02 16L4 32C4 34.21 5.79 36 8 36H40C42.21 36 44 34.21 44 32V16C44 13.79 42.21 12 40 12ZM40 32H8V22H40V32ZM40 16H8V14H40V16Z" fill="#4285F4"/>
        <circle cx="34" cy="27" r="3" fill="#34A853"/>
      </svg>

      <span className="font-semibold tracking-wide font-sans">
        {cargando ? 'Generando pase...' : texto}
      </span>
    </button>
  );
};
