import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ModoTema = 'system' | 'light' | 'dark';

type TemaAppContextValue = {
  modo: ModoTema;
  esquema: 'light' | 'dark';
  cambiarModo: (modo: ModoTema) => Promise<void>;
};

const TemaAppContext = createContext<TemaAppContextValue | null>(null);

export function TemaAppProvider({ children }: { children: React.ReactNode }) {
  const sistema = useColorScheme();
  const [modo, setModo] = useState<ModoTema>('system');

  useEffect(() => {
    AsyncStorage.getItem('sigic_tema').then((guardado) => {
      if (guardado === 'light' || guardado === 'dark' || guardado === 'system') setModo(guardado);
    });
  }, []);

  const esquema = modo === 'system' ? (sistema === 'dark' ? 'dark' : 'light') : modo;
  const valor = useMemo(() => ({
    modo,
    esquema,
    cambiarModo: async (nuevoModo: ModoTema) => {
      setModo(nuevoModo);
      await AsyncStorage.setItem('sigic_tema', nuevoModo);
    },
  }), [modo, esquema]);

  return <TemaAppContext.Provider value={valor}>{children}</TemaAppContext.Provider>;
}

export function useTemaApp() {
  const contexto = useContext(TemaAppContext);
  if (!contexto) throw new Error('useTemaApp debe utilizarse dentro de TemaAppProvider');
  return contexto;
}
