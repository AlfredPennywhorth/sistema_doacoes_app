import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { UpdateHandler } from '@/components/UpdateHandler';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/hooks/useAuth';

// Impede que a Splash Screen feche sozinha antes de estarmos prontos
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // Não autenticado → vai para login
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Já autenticado → vai para o app
      router.replace('/(tabs)');
    }

    // Sinaliza que a lógica de auth terminou
    setAppIsReady(true);
  }, [user, loading, segments, router]);

  useEffect(() => {
    if (appIsReady) {
      // Oculta a splash screen quando o roteamento inicial estiver decidido
      SplashScreen.hideAsync().catch(() => {
        /* ignore */
      });
    }
  }, [appIsReady]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen name="donate/new" options={{ headerShown: false }} />
        <Stack.Screen name="donate/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="legal/terms" options={{ headerShown: false }} />
        <Stack.Screen name="legal/privacy" options={{ headerShown: false }} />
        <Stack.Screen name="admin/warehouses" options={{ title: 'Galpões', headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <UpdateHandler />
      <RootLayoutNav />
    </AuthProvider>
  );
}
