import { Colors } from '@/constantes/tema';
import { useColorScheme } from '@/hooks/usar-esquema-color';

export function useTheme() {
  const scheme = useColorScheme();
  const tema = scheme === 'unspecified' ? 'light' : scheme;
  return Colors[tema];
}

// Alias de compatibilidad
export { useTheme as useTema };
