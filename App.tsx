import React, { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initDatabase } from './src/storage/database';
import { seedDatabase } from './src/storage/seed';
import { ModeProvider } from './src/context/ModeContext';
import { COLORS } from './src/constants/colors';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        await seedDatabase();
        setReady(true);
      } catch (e: any) {
        console.error('[App] Erreur initialisation :', e);
        setError(String(e?.message ?? e));
      }
    }
    setup();
  }, []);

  if (error) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>{'⚠ ERREUR DE DÉMARRAGE'}</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <Text style={styles.errorHint}>
            {'Copiez ce texte et envoyez-le.\nOu : npx expo start --clear'}
          </Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  if (!ready) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.loading}>
          <Image source={require('./assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 24 }} />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ModeProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </ModeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  logo: {
    width: 180,
    height: 180,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    backgroundColor: '#C0392B',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 20,
  },
  errorMsg: {
    fontSize: 14,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
  },
});
