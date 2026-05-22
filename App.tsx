import React, { useEffect, useState } from 'react';
import { View, Image, ActivityIndicator, StyleSheet } from 'react-native';
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

  useEffect(() => {
    async function setup() {
      await initDatabase();
      await seedDatabase();
      setReady(true);
    }
    setup();
  }, []);

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
});
