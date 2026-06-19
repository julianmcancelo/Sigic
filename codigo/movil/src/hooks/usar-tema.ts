import { Colors } from '@/constantes/tema';
import { useTemaApp } from '@/contextos/tema-app';

export function useTheme() {
  const { esquema } = useTemaApp();
  return Colors[esquema];
}

// Alias de compatibilidad
export { useTheme as useTema };
