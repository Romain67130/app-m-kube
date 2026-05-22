import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ReglagesScreen } from '../screens/reglages/ReglagesScreen';
import { CollaborateurFormScreen } from '../screens/reglages/CollaborateurFormScreen';
import { HeaderTitle } from '../components/HeaderTitle';
import { COLORS } from '../constants/colors';

const Stack = createNativeStackNavigator();

export function ReglagesNavigator() {
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
        name="ReglagesMain"
        component={ReglagesScreen}
        options={{ headerTitle: () => <HeaderTitle title="Réglages" /> }}
      />
      <Stack.Screen
        name="CollaborateurForm"
        component={CollaborateurFormScreen}
        options={{ headerTitle: () => <HeaderTitle title="Collaborateur" /> }}
      />
    </Stack.Navigator>
  );
}
