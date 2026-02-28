// packages/mobile/src/context/AuthContext.tsx


// Manages authentication state (userId, isAdmin) with AsyncStorage persistence across sessions.
// Provides login and logout actions and blocks rendering until the stored auth state is loaded.

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  userId: number | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (id: number, admin: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state on mount
  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedIsAdmin = await AsyncStorage.getItem('isAdmin');
      
      if (storedUserId) {
        setUserId(Number(storedUserId));
        setIsAdmin(storedIsAdmin === 'true');
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (id: number, admin: boolean = false) => {
    try {
      await AsyncStorage.setItem('userId', id.toString());
      await AsyncStorage.setItem('isAdmin', admin.toString());
      setUserId(id);
      setIsAdmin(admin);
    } catch (error) {
      console.error('Failed to save auth state:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('isAdmin');
      setUserId(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Failed to clear auth state:', error);
      throw error;
    }
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <AuthContext.Provider
      value={{
        userId,
        isAdmin,
        isAuthenticated: userId !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}