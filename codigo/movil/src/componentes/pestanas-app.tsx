import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constantes/tema';
import { useTemaApp } from '@/contextos/tema-app';

export default function AppTabs() {
  const { esquema } = useTemaApp();
  const colors = Colors[esquema];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0056B3',
        tabBarInactiveTintColor: colors.textSecondary ?? '#999',
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.backgroundElement, borderTopColor: colors.backgroundSelected }],
        tabBarItemStyle: styles.tabItem,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accesos',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
              <Ionicons name={focused ? 'qr-code' : 'qr-code-outline'} size={22} color={focused ? '#ffffff' : color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explorar"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
              <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={focused ? '#ffffff' : color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 76,
    paddingTop: 8,
    paddingBottom: 9,
    borderTopWidth: 1,
    borderTopColor: '#DBEAFE',
    backgroundColor: '#FFFFFF',
    shadowColor: '#06194D',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 12,
  },
  tabItem: {
    borderRadius: 18,
  },
  tabLabel: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  iconBox: {
    width: 38,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    backgroundColor: '#0056B3',
    shadowColor: '#0056B3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
});
