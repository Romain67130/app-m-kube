import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChantiersScreen } from '../screens/chantiers/ChantiersScreen';
import { ChantierDetailScreen } from '../screens/chantiers/ChantierDetailScreen';
import { ChantierFormScreen } from '../screens/chantiers/ChantierFormScreen';
import { HeaderTitle } from '../components/HeaderTitle';
import { COLORS } from '../constants/colors';

const Stack = createNativeStackNavigator();

export function ChantiersNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.textLight,
        headerTitleAlign: 'center',
        headerTitleStyle: { fontWeight: '700', color: COLORS.textLight },
      }}
    >
      <Stack.Screen
        name="ChantiersList"
        component={ChantiersScreen}
        options={{ headerTitle: () => <HeaderTitle title="Chantiers" /> }}
      />
      <Stack.Screen
        name="ChantierDetail"
        component={ChantierDetailScreen}
        options={{ headerTitle: () => <HeaderTitle title="Détail chantier" /> }}
      />
      <Stack.Screen
        name="ChantierForm"
        component={ChantierFormScreen}
        options={{ headerTitle: () => <HeaderTitle title="Nouveau chantier" /> }}
      />
    </Stack.Navigator>
  );
}
