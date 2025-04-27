import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: object;
  textStyle?: object;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const { theme, isDark } = useTheme();
  
  // Bestimme die Stile basierend auf der Variante
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? theme.colors.placeholder : theme.colors.primary,
          borderColor: 'transparent',
          textColor: 'white',
        };
      case 'secondary':
        return {
          backgroundColor: disabled ? theme.colors.placeholder + '30' : theme.colors.secondary,
          borderColor: 'transparent',
          textColor: isDark ? 'black' : 'white',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: disabled ? theme.colors.placeholder : theme.colors.primary,
          textColor: disabled ? theme.colors.placeholder : theme.colors.primary,
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: disabled ? theme.colors.placeholder : theme.colors.primary,
        };
      default:
        return {
          backgroundColor: disabled ? theme.colors.placeholder : theme.colors.primary,
          borderColor: 'transparent',
          textColor: 'white',
        };
    }
  };
  
  // Bestimme die Größe basierend auf dem Parameter
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 6,
          paddingHorizontal: 12,
          fontSize: 14,
          borderRadius: theme.borderRadius.small,
        };
      case 'medium':
        return {
          paddingVertical: 10,
          paddingHorizontal: 16,
          fontSize: 16,
          borderRadius: theme.borderRadius.medium,
        };
      case 'large':
        return {
          paddingVertical: 14,
          paddingHorizontal: 24,
          fontSize: 18,
          borderRadius: theme.borderRadius.medium,
        };
      default:
        return {
          paddingVertical: 10,
          paddingHorizontal: 16,
          fontSize: 16,
          borderRadius: theme.borderRadius.medium,
        };
    }
  };
  
  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          borderWidth: variant === 'outline' ? 2 : 0,
          borderRadius: sizeStyles.borderRadius,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          width: fullWidth ? '100%' : 'auto',
          opacity: disabled ? 0.7 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <View style={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={variantStyles.textColor} 
            style={styles.loader} 
          />
        ) : icon ? (
          <View style={styles.iconContainer}>{icon}</View>
        ) : null}
        
        <Text
          style={[
            styles.text,
            {
              color: variantStyles.textColor,
              fontSize: sizeStyles.fontSize,
              marginLeft: (loading || icon) ? 8 : 0,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  loader: {
    marginRight: 8,
  },
  iconContainer: {
    marginRight: 8,
  },
});

export default Button;
