import { DefaultTheme, DarkTheme } from '@react-navigation/native';

// Erweiterte Farbpalette für ein modernes, ansprechendes Design
const colors = {
  // Primärfarben
  primary: {
    light: '#6200EE', // Violett
    dark: '#BB86FC',
  },
  secondary: {
    light: '#03DAC6', // Türkis
    dark: '#03DAC6',
  },
  accent: {
    light: '#FF4081', // Pink
    dark: '#CF6679',
  },
  
  // Hintergrundfarben
  background: {
    light: '#F5F7FA',
    dark: '#121212',
  },
  surface: {
    light: '#FFFFFF',
    dark: '#1E1E1E',
  },
  card: {
    light: '#FFFFFF',
    dark: '#2C2C2C',
  },
  
  // Textfarben
  text: {
    light: '#1A1A1A',
    dark: '#FFFFFF',
  },
  subtext: {
    light: '#5F6368',
    dark: '#B0B0B0',
  },
  placeholder: {
    light: '#9AA0A6',
    dark: '#6F6F6F',
  },
  
  // Statusfarben
  success: {
    light: '#4CAF50',
    dark: '#4CAF50',
  },
  warning: {
    light: '#FFC107',
    dark: '#FFC107',
  },
  error: {
    light: '#F44336',
    dark: '#CF6679',
  },
  info: {
    light: '#2196F3',
    dark: '#64B5F6',
  },
  
  // Grenzfarben
  border: {
    light: '#E0E0E0',
    dark: '#444444',
  },
  divider: {
    light: '#EEEEEE',
    dark: '#333333',
  },
  
  // Spezielle Farben
  backdrop: {
    light: 'rgba(0, 0, 0, 0.5)',
    dark: 'rgba(0, 0, 0, 0.7)',
  },
  overlay: {
    light: 'rgba(255, 255, 255, 0.8)',
    dark: 'rgba(30, 30, 30, 0.8)',
  },
  notification: {
    light: '#FF80AB',
    dark: '#FF80AB',
  },
};

// Schatten für verschiedene Erhebungsstufen
const shadows = {
  small: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    dark: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2.0,
      elevation: 1,
    },
  },
  medium: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3.0,
      elevation: 3,
    },
    dark: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 3.0,
      elevation: 3,
    },
  },
  large: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 5.0,
      elevation: 5,
    },
    dark: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 5.0,
      elevation: 5,
    },
  },
};

// Abgerundete Ecken für verschiedene Komponenten
const borderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  extraLarge: 24,
  round: 9999,
};

// Abstandsmaße für konsistentes Layout
const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

// Typografie-Definitionen
const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    s: 14,
    m: 16,
    l: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  lineHeight: {
    xs: 16,
    s: 20,
    m: 24,
    l: 28,
    xl: 32,
    xxl: 36,
    xxxl: 40,
  },
};

// Animationsdauern
const animation = {
  short: 150,
  medium: 300,
  long: 500,
};

// Erstelle das Light-Theme
export const lightTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    primary: colors.primary.light,
    secondary: colors.secondary.light,
    accent: colors.accent.light,
    background: colors.background.light,
    surface: colors.surface.light,
    card: colors.card.light,
    text: colors.text.light,
    subtext: colors.subtext.light,
    placeholder: colors.placeholder.light,
    border: colors.border.light,
    divider: colors.divider.light,
    notification: colors.notification.light,
    success: colors.success.light,
    warning: colors.warning.light,
    error: colors.error.light,
    info: colors.info.light,
    backdrop: colors.backdrop.light,
    overlay: colors.overlay.light,
  },
  shadows,
  borderRadius,
  spacing,
  typography,
  animation,
};

// Erstelle das Dark-Theme
export const darkTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    primary: colors.primary.dark,
    secondary: colors.secondary.dark,
    accent: colors.accent.dark,
    background: colors.background.dark,
    surface: colors.surface.dark,
    card: colors.card.dark,
    text: colors.text.dark,
    subtext: colors.subtext.dark,
    placeholder: colors.placeholder.dark,
    border: colors.border.dark,
    divider: colors.divider.dark,
    notification: colors.notification.dark,
    success: colors.success.dark,
    warning: colors.warning.dark,
    error: colors.error.dark,
    info: colors.info.dark,
    backdrop: colors.backdrop.dark,
    overlay: colors.overlay.dark,
  },
  shadows,
  borderRadius,
  spacing,
  typography,
  animation,
};

export default { lightTheme, darkTheme };
