import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: object;
  onPress?: () => void;
  elevation?: 'small' | 'medium' | 'large';
  borderRadius?: 'small' | 'medium' | 'large' | 'extraLarge';
  padding?: 'none' | 's' | 'm' | 'l';
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  elevation = 'medium',
  borderRadius = 'medium',
  padding = 'm',
}) => {
  const { theme, isDark } = useTheme();
  
  // Bestimme die Schatten basierend auf dem Theme und der Elevation
  const shadow = theme.shadows[elevation][isDark ? 'dark' : 'light'];
  
  // Bestimme den Radius basierend auf dem Theme
  const radius = theme.borderRadius[borderRadius];
  
  // Bestimme das Padding basierend auf dem Theme
  const paddingValue = padding === 'none' ? 0 : theme.spacing[padding];
  
  // Basis-Styling für die Karte
  const cardStyle = {
    ...styles.card,
    ...shadow,
    borderRadius: radius,
    padding: paddingValue,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    ...style,
  };
  
  // Wenn onPress vorhanden ist, mache die Karte anklickbar
  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }
  
  // Ansonsten gib eine normale View zurück
  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    marginVertical: 8,
    overflow: 'hidden',
  },
});

export default Card;
