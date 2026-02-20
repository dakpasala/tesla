import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { createMMKV } from 'react-native-mmkv';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const storage = createMMKV();

const STORAGE_KEY = 'theme_preference';

type ThemeContextValue = {
  preference: ThemePreference;
  theme: ResolvedTheme;
  setTheme: (pref: ThemePreference) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredPreference(): ThemePreference | null {
  const value = storage.getString(STORAGE_KEY);
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return null;
}

function resolveTheme(
  pref: ThemePreference,
  system: ResolvedTheme
): ResolvedTheme {
  return pref === 'system' ? system : pref;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const systemTheme: ResolvedTheme = systemScheme === 'dark' ? 'dark' : 'light';

  const [preference, setPreference] = useState<ThemePreference>(() => {
    return readStoredPreference() ?? 'system';
  });

  const theme = useMemo(
    () => resolveTheme(preference, systemTheme),
    [preference, systemTheme]
  );

  const setTheme = (pref: ThemePreference) => {
    setPreference(pref);
    storage.set(STORAGE_KEY, pref);
    console.log('[Theme] setTheme:', pref);
  };

  const toggleTheme = () => {
    const next: ThemePreference =
      preference === 'light'
        ? 'dark'
        : preference === 'dark'
          ? 'system'
          : 'light';
    setTheme(next);
  };

  const value = useMemo(
    () => ({ preference, theme, setTheme, toggleTheme }),
    [preference, theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
