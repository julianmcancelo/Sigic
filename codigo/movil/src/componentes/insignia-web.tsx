import { version } from 'expo/package.json';
import { Image } from 'expo-image';
import { useColorScheme, StyleSheet } from 'react-native';

import { TextoTematizado } from './texto-tematizado';
import { VistaTematizada } from './vista-tematizada';

import { Spacing } from '@/constantes/tema';

export function InsigniaWeb() {
  const scheme = useColorScheme();

  return (
    <VistaTematizada style={styles.container}>
      <TextoTematizado type="code" themeColor="textSecondary" style={styles.versionText}>
        v{version}
      </TextoTematizado>
      <Image
        source={
          scheme === 'dark'
            ? require('../../assets/images/expo-badge-white.png')
            : require('../../assets/images/expo-badge.png')
        }
        style={styles.badgeImage}
      />
    </VistaTematizada>
  );
}

// Alias de compatibilidad
export { InsigniaWeb as WebBadge };

const styles = StyleSheet.create({
  container: { padding: Spacing.five, alignItems: 'center', gap: Spacing.two },
  versionText: { textAlign: 'center' },
  badgeImage: { width: 123, aspectRatio: 123 / 24 },
});
