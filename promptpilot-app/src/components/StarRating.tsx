import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  spacing?: number;
  color?: string;
  emptyColor?: string;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  showRating?: boolean;
  style?: object;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 24,
  spacing = 2,
  color,
  emptyColor,
  onRatingChange,
  readonly = false,
  showRating = false,
  style,
}) => {
  const { theme } = useTheme();
  
  // Verwende Theme-Farben, wenn keine spezifischen Farben angegeben wurden
  const starColor = color || theme.colors.primary;
  const starEmptyColor = emptyColor || theme.colors.placeholder;
  
  // Stelle sicher, dass die Bewertung innerhalb des gültigen Bereichs liegt
  const validRating = Math.max(0, Math.min(rating, maxRating));
  
  // Rendere einen einzelnen Stern
  const renderStar = (position: number) => {
    const isFilled = position <= validRating;
    const isHalfFilled = !isFilled && position - 0.5 <= validRating;
    
    // Bestimme das Stern-Symbol basierend auf dem Füllstand
    const starIcon = isFilled ? '★' : isHalfFilled ? '★' : '☆';
    
    return (
      <TouchableOpacity
        key={position}
        style={[styles.star, { marginHorizontal: spacing }]}
        onPress={() => onRatingChange && onRatingChange(position)}
        disabled={readonly}
        activeOpacity={readonly ? 1 : 0.7}
      >
        <Text
          style={{
            fontSize: size,
            color: isFilled || isHalfFilled ? starColor : starEmptyColor,
          }}
        >
          {starIcon}
        </Text>
      </TouchableOpacity>
    );
  };
  
  // Erstelle ein Array mit den Positionen der Sterne
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsContainer}>
        {stars.map(position => renderStar(position))}
      </View>
      
      {showRating && (
        <Text style={[styles.ratingText, { color: theme.colors.text }]}>
          {validRating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StarRating;
