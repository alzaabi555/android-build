
import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'vision' | 'ceramic';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
  isLowPower: boolean;
  toggleLowPower: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const savedTheme = localStorage.getItem('app-theme');
    // If previously android, fallback to ceramic (iOS Light)
    if (savedTheme === 'vision') return 'vision';
    return 'ceramic';
  });

  const [isLowPower, setIsLowPower] = useState<boolean>(() => {
      return localStorage.getItem('app-low-power') === 'true';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Clean up old classes
    root.classList.remove('dark', 'light', 'android-mode', 'low-power');
    root.removeAttribute('data-theme');

    root.setAttribute('data-theme', theme);

    if (theme === 'vision') {
        root.classList.add('dark');
    } else {
        root.classList.add('light');
    }

    if (isLowPower) {
        root.classList.add('low-power');
    }

    localStorage.setItem('app-theme', theme);
    localStorage.setItem('app-low-power', String(isLowPower));
  }, [theme, isLowPower]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleLowPower = () => {
      setIsLowPower(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark: theme === 'vision', isLowPower, toggleLowPower }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
