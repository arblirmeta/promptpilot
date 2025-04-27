import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from './theme';

// Definiere den Typ für den Theme-Kontext
type ThemeContextType = {
  theme: typeof lightTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
};

// Erstelle den Kontext mit Standardwerten
export const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

// Hook für den einfachen Zugriff auf den Theme-Kontext
export const useTheme = () => useContext(ThemeContext);

// Props für den ThemeProvider
interface ThemeProviderProps {
  children: React.ReactNode;
}

// ThemeProvider-Komponente
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Lese das Systemthema aus
  const colorScheme = useColorScheme();
  
  // Initialisiere den Theme-Zustand basierend auf dem Systemthema
  const [isDark, setIsDark] = useState(colorScheme === 'dark');
  
  // Aktualisiere das Theme, wenn sich das Systemthema ändert
  useEffect(() => {
    setIsDark(colorScheme === 'dark');
  }, [colorScheme]);
  
  // Funktion zum Umschalten des Themes
  const toggleTheme = () => {
    setIsDark(!isDark);
  };
  
  // Funktion zum direkten Setzen des Themes
  const setTheme = (dark: boolean) => {
    setIsDark(dark);
  };
  
  // Wähle das aktuelle Theme basierend auf isDark
  const theme = isDark ? darkTheme : lightTheme;
  
  // Stelle den Theme-Kontext bereit
  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
