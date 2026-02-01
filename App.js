import './global.css'; // NativeWind
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { SquadProvider } from './src/context/SquadContext';
import { UserProvider } from './src/context/UserContext';
import RootNavigator from './src/navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

const MainApp = () => {
  const { colors, themeName } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={themeName === 'Obsidian' ? 'light' : 'auto'} />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </View>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <UserProvider>
          <SquadProvider>
            <MainApp />
          </SquadProvider>
        </UserProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
