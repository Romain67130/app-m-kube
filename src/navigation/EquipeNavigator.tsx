import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EquipeScreen } from '../screens/equipe/EquipeScreen';
import { CollaborateurDetailScreen } from '../screens/equipe/CollaborateurDetailScreen';
import { HorairesScreen } from '../screens/equipe/HorairesScreen';
import { AbsencesScreen } from '../screens/equipe/AbsencesScreen';
import { AbsenceFormScreen } from '../screens/equipe/AbsenceFormScreen';
import { HeaderTitle } from '../components/HeaderTitle';
import { COLORS } from '../constants/colors';

const Stack = createNativeStackNavigator();

export function EquipeNavigator() {
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
        name="EquipeList"
        component={EquipeScreen}
        options={{ headerTitle: () => <HeaderTitle title="Équipe" /> }}
      />
      <Stack.Screen
        name="CollaborateurDetail"
        component={CollaborateurDetailScreen}
        options={{ headerTitle: () => <HeaderTitle title="Collaborateur" /> }}
      />
      <Stack.Screen
        name="Horaires"
        component={HorairesScreen}
        options={{ headerTitle: () => <HeaderTitle title="Horaires" /> }}
      />
      <Stack.Screen
        name="Absences"
        component={AbsencesScreen}
        options={{ headerTitle: () => <HeaderTitle title="Absences" /> }}
      />
      <Stack.Screen
        name="AbsenceForm"
        component={AbsenceFormScreen}
        options={{ headerTitle: () => <HeaderTitle title="Saisir une absence" /> }}
      />
    </Stack.Navigator>
  );
}
