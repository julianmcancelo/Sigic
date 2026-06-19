import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { AnimatedSplashOverlay } from '@/componentes/icono-animado';
import AppTabs from '@/componentes/pestanas-app';
import { TemaAppProvider, useTemaApp } from '@/contextos/tema-app';

function ContenidoAplicacion() {
  const { esquema } = useTemaApp();
  return (
    <ThemeProvider value={esquema === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}

export default function TabLayout() {
  return (
    <TemaAppProvider>
      <ContenidoAplicacion />
    </TemaAppProvider>
  );
}
