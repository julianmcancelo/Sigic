import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';

import { TextoTematizado } from './texto-tematizado';
import { VistaTematizada } from './vista-tematizada';

import { Colors, MaxContentWidth, Spacing } from '@/constantes/tema';
import { useTemaApp } from '@/contextos/tema-app';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Inicio</TabButton>
          </TabTrigger>
          <TabTrigger name="explorar" href="/explorar" asChild>
            <TabButton>Ajustes</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <VistaTematizada
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <TextoTematizado type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </TextoTematizado>
      </VistaTematizada>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const { esquema } = useTemaApp();
  const colors = Colors[esquema];

  return (
    <View {...props} style={styles.tabListContainer}>
      <VistaTematizada type="backgroundElement" style={styles.innerContainer}>
        <TextoTematizado type="smallBold" style={styles.brandText}>
          SiGIC
        </TextoTematizado>

        {props.children}

        <TextoTematizado type="small" style={{ color: colors.textSecondary }}>Entry</TextoTematizado>
      </VistaTematizada>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
