import { PropsWithChildren, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { TextoTematizado } from '@/componentes/texto-tematizado';
import { VistaTematizada } from '@/componentes/vista-tematizada';
import { Spacing } from '@/constantes/tema';
import { useTheme } from '@/hooks/usar-tema';

export function Desplegable({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();

  return (
    <VistaTematizada>
      <Pressable
        style={({ pressed }) => [styles.heading, pressed && styles.pressedHeading]}
        onPress={() => setIsOpen((value) => !value)}>
        <VistaTematizada type="backgroundElement" style={styles.button}>
          <Text style={{ color: theme.text, fontSize: 12, transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}>
            ›
          </Text>
        </VistaTematizada>

        <TextoTematizado type="small">{title}</TextoTematizado>
      </Pressable>
      {isOpen && (
        <Animated.View entering={FadeIn.duration(200)}>
          <VistaTematizada type="backgroundElement" style={styles.content}>
            {children}
          </VistaTematizada>
        </Animated.View>
      )}
    </VistaTematizada>
  );
}

// Alias de compatibilidad
export { Desplegable as Collapsible };

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  pressedHeading: { opacity: 0.7 },
  button: { width: Spacing.four, height: Spacing.four, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  content: { marginTop: Spacing.three, borderRadius: Spacing.three, marginLeft: Spacing.four, padding: Spacing.four },
});
