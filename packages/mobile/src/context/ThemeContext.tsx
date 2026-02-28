// Manages the active color theme (light, dark, or system) with MMKV persistence.
// Exposes the resolved theme, the full theme object, and helpers to set or toggle the preference.

import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { lightTheme, darkTheme, AppTheme } from '../theme/theme';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const storage = createMMKV();
const STORAGE_KEY = 'theme_preference';

type ThemeContextValue = {
  preference: ThemePreference;
  theme: ResolvedTheme;
  activeTheme: AppTheme;
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

  // The actual theme object components should use for colors/typography
  const activeTheme = useMemo(
    () => (theme === 'dark' ? darkTheme : lightTheme),
    [theme]
  );

  const setTheme = (pref: ThemePreference) => {
    setPreference(pref);
    storage.set(STORAGE_KEY, pref);
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
    () => ({ preference, theme, activeTheme, setTheme, toggleTheme }),
    [preference, theme, activeTheme]
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