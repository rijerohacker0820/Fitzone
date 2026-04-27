import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import {
  Home,
  Users,
  MessageSquare,
  User,
  BarChart3,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View } from "react-native";
import HomeScreen from "../screens/HomeScreen";
import SocialScreen from "../screens/SocialScreen";
import ProfileScreen from "../screens/ProfileScreen";
import StatsScreen from "../screens/StatsScreen";
import RoutinesScreen from "../screens/RoutinesScreen";
import MembershipScreen from "../screens/MembershipScreen";
import { Crown, Dumbbell } from "lucide-react-native";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const isDark = colors.background !== "#F8FAFC";
  const TAB_HEIGHT = 60 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#0F0F0F" : "#FFFFFF",
          borderTopColor: isDark ? "#1A1A1A" : "#F1F5F9",
          borderTopWidth: 1,
          height: TAB_HEIGHT,
          paddingBottom: insets.bottom + 10,
          paddingTop: 10,
          ...(Platform.OS === "web"
            ? ({ boxShadow: "0px -2px 12px rgba(0,0,0,0.06)" } as any)
            : {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 8,
              }),
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? "#555" : "#94A3B8",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t("home") || "Inicio",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Routines"
        component={RoutinesScreen}
        options={{
          tabBarLabel: "Rutinas",
          tabBarIcon: ({ color, size }) => (
            <Dumbbell color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Social"
        component={SocialScreen}
        options={{
          tabBarLabel: t("social") || "Social",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Plans"
        component={MembershipScreen}
        options={{
          tabBarLabel: "Planes",
          tabBarIcon: ({ color, size }) => <Crown color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t("profile") || "Perfil",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
