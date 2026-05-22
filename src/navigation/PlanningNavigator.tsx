import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PlanningScreen } from '../screens/planning/PlanningScreen';
import { HeaderTitle } from '../components/HeaderTitle';
import { COLORS } from '../constants/colors';

const Stack = createNativeStackNavigator();

export function PlanningNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.textLight,
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="PlanningMain"
        component={PlanningScreen}
        options={{ headerTitle: () => <HeaderTitle title="Planning" /> }}
      />
    </Stack.Navigator>
  );
}
