import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // using native stack for performance
import TabNavigator from './TabNavigator';
import {
    ActiveWorkoutScreen,
    ScheduleScreen,
    WorkoutSummaryScreen,
    SquadDetailScreen,
    SquadSettingsScreen
} from '../screens';
import { WorkoutRoutine } from '../types';
import { useLanguage } from '../context/LanguageContext';

import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    const { t } = useLanguage();
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen
                name="ActiveWorkout"
                component={ActiveWorkoutScreen}
                options={{
                    gestureEnabled: false,
                    presentation: 'fullScreenModal'
                }}
            />
            <Stack.Screen
                name="Schedule"
                component={ScheduleScreen}
                options={{
                    presentation: 'modal',
                    headerShown: true,
                    headerTitle: t('schedule'),
                    headerStyle: { backgroundColor: '#FFF' },
                    headerShadowVisible: false,
                }}
            />
            <Stack.Screen
                name="WorkoutSummary"
                component={WorkoutSummaryScreen}
                options={{
                    gestureEnabled: false,
                }}
            />
            <Stack.Screen
                name="SquadDetail"
                component={SquadDetailScreen}
            />
            <Stack.Screen
                name="SquadSettings"
                component={SquadSettingsScreen}
                options={{
                    presentation: 'modal'
                }}
            />
        </Stack.Navigator>
    );
}
