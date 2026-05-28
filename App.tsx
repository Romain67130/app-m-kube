import React, { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, Text, ScrollView } from 'react-native';
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
        <ScrollView contentContainerStyle={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠ Erreur de démarrage</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <Text style={styles.errorHint}>
            Copiez ce message et envoyez-le pour corriger le problème.{'\n'}
            Ou exécutez : npx expo start --clear
          </Text>
        </ScrollView>
      </GestureHandlerRootView>
    );
  }

  if (!ready) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.loading}>
          <Image source={require('./assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 24 }} />
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
  errorContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#C0392B',
    marginBottom: 16,
  },
  errorMsg: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#333',
    backgroundColor: '#FDECEA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorHint: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});
