import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';

import { TextoTematizado } from './texto-tematizado';
import { VistaTematizada } from './vista-tematizada';

import { Spacing } from '@/constantes/tema';

type FilaSugerenciaProps = {
  title?: string;
  hint?: ReactNode;
};

export function FilaSugerencia({ title = 'Edita', hint = 'app/index.tsx' }: FilaSugerenciaProps) {
  return (
    <View style={styles.stepRow}>
      <TextoTematizado type="small">{title}</TextoTematizado>
      <VistaTematizada type="backgroundSelected" style={styles.codeSnippet}>
        <TextoTematizado themeColor="textSecondary">{hint}</TextoTematizado>
      </VistaTematizada>
    </View>
  );
}

// Alias de compatibilidad
export { FilaSugerencia as HintRow };

const styles = StyleSheet.create({
  stepRow: { flexDirection: 'row', justifyContent: 'space-between' },
  codeSnippet: { borderRadius: Spacing.two, paddingVertical: Spacing.half, paddingHorizontal: Spacing.two },
});
