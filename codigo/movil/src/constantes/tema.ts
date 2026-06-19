/**
 * Colores del sistema de diseño de SiGIC.
 * Definidos para modo claro y oscuro.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#06194D',
    background: '#F4F9FF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#DBEAFE',
    textSecondary: '#64748B',
  },
  dark: {
    text: '#F8FAFC',
    background: '#06142F',
    backgroundElement: '#0B2147',
    backgroundSelected: '#123B70',
    textSecondary: '#A8C7EA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fuentes = Platform.select({
  ios: {
    sanSerif: 'system-ui',
    serif: 'ui-serif',
    redondeada: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sanSerif: 'normal',
    serif: 'serif',
    redondeada: 'normal',
    mono: 'monospace',
  },
  web: {
    sanSerif: 'var(--font-display)',
    serif: 'var(--font-serif)',
    redondeada: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

// Alias de compatibilidad con código existente
export const Fonts = {
  mono: Fuentes?.mono ?? 'monospace',
};

export const Espaciado = {
  medio: 2,
  uno: 4,
  dos: 8,
  tres: 16,
  cuatro: 24,
  cinco: 32,
  seis: 64,
} as const;

// Alias de compatibilidad
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
