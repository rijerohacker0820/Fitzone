import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import storage from "../utils/secureStorage";
import { setOnUnauthorized } from "../api/apiClient";
import {
  login as apiLogin,
  LoginRequest,
  LoginResponse,
} from "../services/authService";
import { saveUserProfile, getUserProfile } from "../services/storage";
import { useLanguage } from "./LanguageContext";
import { useTheme } from "./ThemeContext";

import { UserProfile, UserStats } from "../types";

interface UserContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateStats: (newStats: Partial<UserStats>) => void;
  refreshUser: () => Promise<void>;
}

const defaultStats: UserStats = {
  workoutsCompleted: 0,
  minutesTrained: 0,
  streakDays: 0,
  weightLifted: 0,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { setLanguage } = useLanguage();
  const { setTheme } = useTheme();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Logout function — also used by apiClient's 401 handler
  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    try {
      await storage.removeItem("auth_token");
    } catch (e) {
      console.error("[UserContext] Failed to delete token:", e);
    }
  }, []);

  // Register the logout callback for 401 auto-logout
  useEffect(() => {
    setOnUnauthorized(() => {
      logout();
    });
  }, [logout]);

  // Load token from secure storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedToken = await storage.getItem("auth_token");

        if (storedToken) {
          setToken(storedToken);
          // Token exists, apiClient interceptor will attach it.
          // Fetch real profile from API (with local cache fallback)
          const profile = await getUserProfile();
          if (profile) {
            setUser(profile);
            if (profile.language) setLanguage(profile.language);
            if (profile.theme) setTheme(profile.theme);
          } else {
            // Token is stale / user deleted — clear everything
            await storage.removeItem("auth_token");
            setToken(null);
          }
        }
      } catch (e) {
        console.error("[UserContext] Failed to load user profile:", e);
        // Clear potentially corrupt token
        await storage.removeItem("auth_token");
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const response: LoginResponse = await apiLogin(data);
      const newToken = response.token;

      if (!newToken) {
        throw new Error("El servidor no devolvió un token de sesión");
      }

      // Store token securely (cross-platform)
      await storage.setItem("auth_token", newToken);
      setToken(newToken);

      // Fetch user profile from API
      const profile = await getUserProfile();
      if (profile) {
        setUser(profile);
        if (profile.language) setLanguage(profile.language);
        if (profile.theme) setTheme(profile.theme);
      } else {
        throw new Error("No se pudo cargar el perfil del usuario");
      }
    } catch (error) {
      // Clean up on failure
      await storage.removeItem("auth_token");
      setToken(null);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    const newUser = { ...user, ...updates };
    setUser(newUser);
    try {
      await saveUserProfile(newUser);
    } catch (e) {
      console.error("[UserContext] Failed to save user profile:", e);
    }
  };

  const updateStats = async (newStats: Partial<UserStats>) => {
    if (!user) return;
    const updatedStats = { ...user.stats, ...newStats };
    updateProfile({ stats: updatedStats });
  };

  const refreshUser = async () => {
    try {
      const profile = await getUserProfile();
      if (profile) {
        setUser(profile);
      }
    } catch (e) {
      console.error("[UserContext] Failed to refresh profile:", e);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        updateProfile,
        updateStats,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
