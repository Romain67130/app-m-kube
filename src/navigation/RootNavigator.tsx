import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/home/HomeScreen';
import { PlanningNavigator } from './PlanningNavigator';
import { ChantiersNavigator } from './ChantiersNavigator';
import { EquipeNavigator } from './EquipeNavigator';
import { ReglagesNavigator } from './ReglagesNavigator';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="PlanningStack" component={PlanningNavigator} />
      <Stack.Screen name="ChantiersStack" component={ChantiersNavigator} />
      <Stack.Screen name="EquipeStack" component={EquipeNavigator} />
      <Stack.Screen name="ReglagesStack" component={ReglagesNavigator} />
    </Stack.Navigator>
  );
}
