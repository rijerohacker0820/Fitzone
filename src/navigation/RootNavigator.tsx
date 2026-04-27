import React, { useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import TabNavigator from "./TabNavigator";
import {
  ActiveWorkoutScreen,
  ScheduleScreen,
  WorkoutSummaryScreen,
  SquadDetailScreen,
  SquadSettingsScreen,
  SettingsScreen,
  LoginScreen,
  SignUpScreen,
  CreatePostScreen,
  SplashScreen,
} from "../screens";
import { useLanguage } from "../context/LanguageContext";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { t } = useLanguage();
  const { user, isLoading } = useUser();
  const { colors } = useTheme();
  const [showSplash, setShowSplash] = useState(true);

  // Show animated splash on first load
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen
            name="ActiveWorkout"
            component={ActiveWorkoutScreen}
            options={{
              gestureEnabled: false,
              presentation: "fullScreenModal",
            }}
          />
          <Stack.Screen
            name="Schedule"
            component={ScheduleScreen}
            options={{
              presentation: "modal",
              headerShown: true,
              headerTitle: t("schedule"),
              headerStyle: { backgroundColor: colors.card },
              headerTintColor: colors.text,
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
          <Stack.Screen name="SquadDetail" component={SquadDetailScreen} />
          <Stack.Screen
            name="SquadSettings"
            component={SquadSettingsScreen}
            options={{
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerShown: false,
              presentation: "card",
            }}
          />
          <Stack.Screen
            name="CreatePost"
            component={CreatePostScreen}
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
