import React, { createContext, useContext, useState, ReactNode } from 'react';
import { themes } from '../theme/colors';
import { ProfileTheme } from '../types';

type ThemeContextType = {
    themeName: ProfileTheme;
    colors: typeof themes['Clean Blue'];
    setTheme: (name: ProfileTheme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [themeName, setThemeName] = useState<ProfileTheme>('Clean Blue');

    const value = {
        themeName,
        colors: themes[themeName],
        setTheme: setThemeName,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
