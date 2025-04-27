import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ProfileAvatar from './ProfileAvatar';
import { format, isValid } from 'date-fns';
import { de } from 'date-fns/locale';

interface PromptCardProps {
  id?: string;
  title: string;
  content: string;
  text?: string;
  description?: string;
  category: string;
  tags: string[];
  authorId?: string;
  userId?: string;
  authorName: string;
  userDisplayName?: string;
  authorImageUrl: string;
  userProfileImage?: string;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  averageRating: number;
  rating?: number;
  ratingCount?: number;
  ratingsCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  isPremium?: boolean;
  onPress?: () => void;
}

const PromptCard: React.FC<PromptCardProps> = ({
  title,
  content,
  text,
  description,
  category,
  tags,
  authorName,
  userDisplayName,
  authorImageUrl,
  userProfileImage,
  likesCount,
  viewsCount,
  commentsCount,
  averageRating,
  rating,
  ratingCount = 0,
  ratingsCount,
  createdAt,
  isPremium = false,
  onPress,
}) => {
  const { theme, isDark } = useTheme();
  
  // Verwende den besten verfügbaren Inhalt: text, content oder description
  const bestContent = text || content || description || '';
  
  // Kürze den Inhalt, wenn er zu lang ist, mit zusätzlicher Sicherheitsprüfung
  const truncatedContent = bestContent.length > 120 
    ? bestContent.substring(0, 120) + '...' 
    : bestContent;
  
  // Sichere Formatierung des Datums mit Fehlerbehandlung
  const formatDate = (timestamp: any): string => {
    try {
      if (!timestamp) return '';
      
      // Firestore Timestamp mit toDate()
      if (timestamp && typeof timestamp.toDate === 'function') {
        return format(timestamp.toDate(), 'dd. MMM', { locale: de });
      }
      
      // Timestamp mit seconds-Property (Firestore)
      if (timestamp && timestamp.seconds) {
        const date = new Date(timestamp.seconds * 1000);
        if (isValid(date)) return format(date, 'dd. MMM', { locale: de });
      }
      
      // ISO String oder Date-Objekt
      if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        if (isValid(date)) return format(date, 'dd. MMM', { locale: de });
      }
      
      // Direkte Date-Objekte
      if (timestamp instanceof Date && isValid(timestamp)) {
        return format(timestamp, 'dd. MMM', { locale: de });
      }
      
      return '';
    } catch (e) {
      console.log('Fehler bei Datumsformatierung in PromptCard:', e);
      return '';
    }
  };
  
  const formattedDate = formatDate(createdAt);
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.borderRadius.medium,
          borderColor: theme.colors.border,
          ...theme.shadows.small[isDark ? 'dark' : 'light'],
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Premium-Badge für Premium-Prompts */}
      {isPremium && (
        <View style={[styles.premiumBadge, { backgroundColor: theme.colors.accent }]}>
          <MaterialCommunityIcons name="crown" size={12} color="white" />
          <Text style={styles.premiumText}>Premium</Text>
        </View>
      )}
      
      {/* Header mit Autor-Informationen */}
      <View style={styles.header}>
        <View style={styles.authorContainer}>
          <ProfileAvatar
            imageUrl={userProfileImage || authorImageUrl}
            size={42}
            fallbackInitial={userDisplayName || authorName}
            showBorder
            borderColor={theme.colors.primary}
            borderWidth={1.5}
          />
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: theme.colors.text }]}>
              {userDisplayName || authorName}
            </Text>
            <View style={styles.categoryDateContainer}>
              <Text style={[styles.category, { color: theme.colors.primary }]}>
                {category}
              </Text>
              {formattedDate && (
                <>
                  <Text style={[styles.dateSeparator, { color: theme.colors.subtext }]}>•</Text>
                  <Text style={[styles.date, { color: theme.colors.subtext }]}>
                    {formattedDate}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
        {/* Verbesserte Bewertungsanzeige */}
        <View style={[styles.ratingContainer, { backgroundColor: isDark ? theme.colors.primary + '20' : theme.colors.warning + '20' }]}>
          <MaterialCommunityIcons 
            name="star" 
            size={14} 
            color={isDark ? theme.colors.primary : theme.colors.warning} 
          />
          <Text style={[styles.rating, { color: isDark ? theme.colors.primary : theme.colors.warning }]}>
            {(rating || averageRating || 0).toFixed(1)}
          </Text>
          {(ratingsCount || ratingCount) > 0 && (
            <Text style={[styles.ratingCountSmall, { color: isDark ? theme.colors.primary : theme.colors.warning }]}>
              ({ratingsCount || ratingCount})
            </Text>
          )}
        </View>
      </View>
      
      {/* Titel und Inhalt */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.description, { color: theme.colors.subtext }]}>
          {truncatedContent}
        </Text>
      </View>
      
      {/* Tags */}
      <View style={styles.tagsContainer}>
        {Array.isArray(tags) && tags.slice(0, 3).map((tag, index) => (
          <View 
            key={index} 
            style={[
              styles.tag, 
              { 
                backgroundColor: theme.colors.primary + '15',
                borderColor: theme.colors.primary + '30',
              }
            ]}
          >
            <Text style={[styles.tagText, { color: theme.colors.primary }]}>
              {tag}
            </Text>
          </View>
        ))}
        {Array.isArray(tags) && tags.length > 3 && (
          <Text style={[styles.moreTag, { color: theme.colors.subtext }]}>
            +{tags.length - 3}
          </Text>
        )}
      </View>
      
      {/* Footer mit Statistiken */}
      <View style={[styles.footer, { borderTopColor: theme.colors.divider }]}>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="eye-outline" size={16} color={theme.colors.subtext} />
          <Text style={[styles.statText, { color: theme.colors.subtext }]}>
            {viewsCount}
          </Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="heart-outline" size={16} color={theme.colors.subtext} />
          <Text style={[styles.statText, { color: theme.colors.subtext }]}>
            {likesCount}
          </Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="comment-outline" size={16} color={theme.colors.subtext} />
          <Text style={[styles.statText, { color: theme.colors.subtext }]}>
            {commentsCount}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    marginVertical: 12,
    marginHorizontal: 2,
    overflow: 'hidden',
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  premiumText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: 13,
    fontWeight: '500',
  },
  dateSeparator: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  date: {
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  ratingCount: {
    fontSize: 12,
    marginLeft: 2,
  },
  ratingCountSmall: {
    fontSize: 10,
    marginLeft: 2,
    opacity: 0.8,
  },
  content: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tag: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 6,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreTag: {
    fontSize: 12,
    marginLeft: 4,
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
  },
  statText: {
    fontSize: 13,
    marginLeft: 5,
  },
});

export default PromptCard;
