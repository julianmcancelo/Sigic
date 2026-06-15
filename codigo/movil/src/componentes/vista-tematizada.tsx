import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constantes/tema';
import { useTheme } from '@/hooks/usar-tema';

export type VistaTematizadaProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function VistaTematizada({ style, lightColor, darkColor, type, ...otherProps }: VistaTematizadaProps) {
  const theme = useTheme();

  return <View style={[{ backgroundColor: theme[type ?? 'background'] }, style]} {...otherProps} />;
}

// Alias de compatibilidad
export { VistaTematizada as ThemedView };
