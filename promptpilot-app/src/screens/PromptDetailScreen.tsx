import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Share, TouchableOpacity } from 'react-native';
import { Text, Button, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import ProfileAvatar from '../components/ProfileAvatar';
import RatingCard from '../components/RatingCard';
import CommentSection from '../components/CommentSection';
import { format, isValid } from 'date-fns';
import { de } from 'date-fns/locale';
import { firestore } from '../config/firebase';
import { doc, getDoc, updateDoc, increment, serverTimestamp, deleteDoc, setDoc } from 'firebase/firestore';
import { auth } from '../config/firebase';
import UserProfileService from '../services/UserProfileService';
import { UserProfile } from '../models/UserProfile';
import { convertToPrompt } from '../models/Prompt';

interface PromptDetailScreenProps {
  route: {
    params: {
      promptId: string;
    };
  };
  navigation: any;
  promptId?: string; // Optional für die direkte Verwendung ohne Navigation
}

const PromptDetailScreen: React.FC<PromptDetailScreenProps> = ({ route, navigation, promptId: propPromptId }) => {
  // Verwende promptId aus route.params oder aus props
  const promptId = propPromptId || (route && route.params ? route.params.promptId : '');
  const { theme, isDark } = useTheme();
  const [prompt, setPrompt] = useState<any>(null);
  const [author, setAuthor] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCurrentUserAuthor, setIsCurrentUserAuthor] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Prompt-Daten laden und Ansichten zählen
  const loadPromptData = useCallback(async () => {
    if (!promptId) {
      setError('Ungültige Prompt-ID');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const promptRef = doc(firestore, 'prompts', promptId);
      const promptSnap = await getDoc(promptRef);
      
      if (!promptSnap.exists()) {
        setError('Prompt nicht gefunden');
        setIsLoading(false);
        return;
      }
      
      const promptData = promptSnap.data();
      const convertedPrompt = convertToPrompt({
        id: promptSnap.id,
        ...promptData
      });
      
      setPrompt(convertedPrompt);
      
      // Zähle den Aufruf
      await updateDoc(promptRef, {
        viewsCount: increment(1),
        updatedAt: serverTimestamp()
      }).catch(err => console.error('Fehler beim Zählen der Aufrufe:', err));
      
      // Lade Autor-Daten basierend auf userId ODER authorId (für Abwärtskompatibilität)
      const authorId = promptData.userId || promptData.authorId;
      if (authorId) {
        const authorProfile = await UserProfileService.getUserProfile(authorId);
        
        // Anreicherung der Autordaten mit den im Prompt gespeicherten Informationen
        // Stelle sicher, dass wir nie undefined als userId haben
        const enrichedAuthorProfile: UserProfile = {
          userId: authorId, // Stelle sicher, dass userId definiert ist
          displayName: authorProfile?.displayName || promptData.userDisplayName || 'Unbekannter Autor',
          photoURL: authorProfile?.photoURL || promptData.userProfileImage || '',
          bio: authorProfile?.bio || '',
          email: authorProfile?.email || '',
          username: authorProfile?.username || '',
          joinDate: authorProfile?.joinDate || new Date(),
          links: authorProfile?.links || { website: '', twitter: '', github: '' },
          followersCount: authorProfile?.followersCount || 0,
          followingCount: authorProfile?.followingCount || 0,
          promptsCount: authorProfile?.promptsCount || 0
        };
        
        setAuthor(enrichedAuthorProfile);
        
        // Prüfe, ob der aktuelle Benutzer der Autor ist
        const currentUser = auth.currentUser;
        if (currentUser) {
          if (currentUser.uid === authorId) {
            setIsCurrentUserAuthor(true);
          } else {
            // Prüfe, ob der aktuelle Benutzer dem Autor folgt
            const isFollowing = await UserProfileService.isFollowing(currentUser.uid, authorId);
            setIsFollowing(isFollowing);
          }
          
          // Prüfe, ob der Benutzer den Prompt geliked hat
          const likeId = `${currentUser.uid}_${promptId}`;
          const likeRef = doc(firestore, 'promptLikes', likeId);
          const likeSnap = await getDoc(likeRef);
          setHasLiked(likeSnap.exists());
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden des Prompts:', error);
      setError('Beim Laden des Prompts ist ein Fehler aufgetreten');
    } finally {
      setIsLoading(false);
    }
  }, [promptId]);

  useEffect(() => {
    loadPromptData();
  }, [loadPromptData, promptId]);
  
  // Folgen/Entfolgen-Funktion
  const handleFollowToggle = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !author) return;
      
      if (isFollowing) {
        await UserProfileService.unfollowUser(currentUser.uid, author.userId);
        setIsFollowing(false);
      } else {
        await UserProfileService.followUser(currentUser.uid, author.userId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Fehler beim Folgen/Entfolgen:', error);
      Alert.alert(
        'Fehler',
        'Beim Folgen/Entfolgen ist ein Fehler aufgetreten',
        [{ text: 'OK' }]
      );
    }
  };
  
  // Like-Funktion
  const handleLikeToggle = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !promptId) {
        Alert.alert(
          'Anmeldung erforderlich',
          'Du musst angemeldet sein, um diese Funktion zu nutzen',
          [{ text: 'OK' }]
        );
        return;
      }
      
      setIsSaving(true);
      const likeId = `${currentUser.uid}_${promptId}`;
      const likeRef = doc(firestore, 'promptLikes', likeId);
      const likeSnap = await getDoc(likeRef);
      
      const promptRef = doc(firestore, 'prompts', promptId);
      
      if (likeSnap.exists()) {
        // Like entfernen
        await deleteDoc(likeRef);
        await updateDoc(promptRef, {
          likesCount: increment(-1),
          updatedAt: serverTimestamp()
        });
        setHasLiked(false);
        
        // Aktualisiere die lokalen Daten
        if (prompt) {
          setPrompt({
            ...prompt,
            likesCount: Math.max(0, (prompt.likesCount || 0) - 1)
          });
        }
      } else {
        // Like hinzufügen
        await setDoc(likeRef, {
          userId: currentUser.uid,
          promptId,
          createdAt: serverTimestamp()
        });
        await updateDoc(promptRef, {
          likesCount: increment(1),
          updatedAt: serverTimestamp()
        });
        setHasLiked(true);
        
        // Aktualisiere die lokalen Daten
        if (prompt) {
          setPrompt({
            ...prompt,
            likesCount: (prompt.likesCount || 0) + 1
          });
        }
      }
    } catch (error) {
      console.error('Fehler beim Liken/Unliken:', error);
      Alert.alert(
        'Fehler',
        'Beim Speichern des Likes ist ein Fehler aufgetreten',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };
  
  // Teilen-Funktion
  const handleShare = async () => {
    if (!prompt) return;
    
    try {
      await Share.share({
        title: prompt.title,
        message: `${prompt.title}\n\n${prompt.content || prompt.description}\n\nGeteilt von PromptPilot`
      });
    } catch (error) {
      console.error('Fehler beim Teilen:', error);
    }
  };
  
  // Bewertungsänderung behandeln
  const handleRatingChange = (newRating: number) => {
    // Aktualisiere die lokalen Prompt-Daten mit der neuen Bewertung
    // Die eigentliche Aktualisierung wird von der RatingCard-Komponente durchgeführt
    loadPromptData(); // Lade Daten neu nach einer Bewertungsänderung
  };
  
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  if (error || !prompt || !promptId) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.error }}>{error || 'Prompt nicht gefunden'}</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={{ marginTop: 16 }}
        >
          Zurück
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header mit Titel, Premium-Badge und Aktionen */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {prompt.title}
          </Text>

          {prompt.isPremium && (
            <Chip
              mode="outlined"
              style={[styles.premiumBadge, { borderColor: theme.colors.primary }]}
              textStyle={{ color: theme.colors.primary, fontWeight: 'bold' }}
            >
              Premium
            </Chip>
          )}
        </View>

        {/* Aktions-Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleShare}
          >
            <MaterialCommunityIcons name="share-variant" size={20} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>Teilen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              hasLiked ? { backgroundColor: theme.colors.primary + '20' } : { backgroundColor: theme.colors.surface }
            ]}
            onPress={handleLikeToggle}
            disabled={isSaving}
          >
            <MaterialCommunityIcons
              name={hasLiked ? "heart" : "heart-outline"}
              size={20}
              color={hasLiked ? theme.colors.primary : theme.colors.text}
            />
            <Text style={[styles.actionText, { color: hasLiked ? theme.colors.primary : theme.colors.text }]}>
              {hasLiked ? "Gefällt dir" : "Gefällt mir"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Autorinformationen */}
        <View style={styles.authorContainer}>
          <ProfileAvatar
            size={48}
            imageUrl={author?.photoURL || prompt.userProfileImage}
            fallbackInitial={author?.displayName || prompt.userDisplayName}
          />
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: theme.colors.text }]}>
              {author?.displayName || prompt.userDisplayName || 'Unbekannter Autor'}
            </Text>
            <View style={styles.metaInfoContainer}>
              {prompt.category && (
                <Text style={[styles.category, { color: theme.colors.primary }]}>
                  {prompt.category}
                </Text>
              )}
            </View>
            <Text style={[styles.authorSubtext, { color: theme.colors.subtext }]}>
              {author?.bio ? `${author.bio.substring(0, 100)}${author.bio.length > 100 ? '...' : ''}` : ''}
            </Text>
          </View>
          {!isCurrentUserAuthor && author && (
            <Button
              mode={isFollowing ? "outlined" : "contained"}
              compact
              style={styles.followButton}
              onPress={handleFollowToggle}
            >
              {isFollowing ? 'Entfolgen' : 'Folgen'}
            </Button>
          )}
        </View>
      </View>

      <Divider style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

      {/* Prompt-Inhalt */}
      <View style={styles.contentSection}>
        <Text style={[styles.contentTitle, { color: theme.colors.text }]}>
          Prompt
        </Text>
        <View style={[styles.promptBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.promptText, { color: theme.colors.text }]}>
            {prompt.text || prompt.content || prompt.description || ''}
          </Text>
          
          {/* Wenn die Bewertung aktiviert ist, zeigen wir die Gesamtbewertung und Anzahl der Bewertungen an */}
          {(prompt.rating || prompt.averageRating) > 0 && (
            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingText, { color: theme.colors.text }]}>
                Bewertung: {prompt.rating || prompt.averageRating}/5
              </Text>
              <Text style={[styles.ratingCount, { color: theme.colors.subtext }]}>
                ({prompt.ratingsCount || prompt.ratingCount || 0} Bewertungen)
              </Text>
            </View>
          )}
        </View>

        <View style={styles.createdAtContainer}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.subtext} />
          <Text style={[styles.createdAtText, { color: theme.colors.subtext }]}>
            {(() => {
              // Sichere Konvertierung der Zeitstempel
              const formatDate = (timestamp: any) => {
                try {
                  if (!timestamp) return null;
                  
                  // Firestore Timestamp
                  if (timestamp && typeof timestamp.toDate === 'function') {
                    return format(timestamp.toDate(), 'dd. MMM yyyy', { locale: de });
                  }
                  
                  // Timestamp mit seconds-Property (Firestore)
                  if (timestamp && timestamp.seconds) {
                    const date = new Date(timestamp.seconds * 1000);
                    if (isValid(date)) return format(date, 'dd. MMM yyyy', { locale: de });
                  }
                  
                  // Date-Objekt oder ISO String
                  const date = new Date(timestamp);
                  if (isValid(date)) return format(date, 'dd. MMM yyyy', { locale: de });
                  
                  return null;
                } catch (e) {
                  console.log('Fehler bei Datumsformatierung:', e);
                  return null;
                }
              };
              
              const createdAtFormatted = formatDate(prompt.createdAt);
              const updatedAtFormatted = formatDate(prompt.updatedAt);
              
              if (!createdAtFormatted) return 'Erstelldatum unbekannt';
              
              let result = `Erstellt am ${createdAtFormatted}`;
              if (updatedAtFormatted && createdAtFormatted !== updatedAtFormatted) {
                result += ` • Aktualisiert am ${updatedAtFormatted}`;
              }
              return result;
            })()}
          </Text>
        </View>
      </View>

      {/* Tags */}
      {prompt.tags && Array.isArray(prompt.tags) && prompt.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          <Text style={[styles.contentTitle, { color: theme.colors.text }]}>
            Tags
          </Text>
          <View style={styles.tagsList}>
            {prompt.tags.map((tag: string, index: number) => (
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
                  {tag || ''}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Divider style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

      {/* Statistiken */}
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="eye-outline" size={18} color={theme.colors.subtext} />
          <Text style={[styles.statText, { color: theme.colors.subtext }]}>
            {prompt.viewsCount || 0} Aufrufe
          </Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons name={hasLiked ? "heart" : "heart-outline"} size={18} color={hasLiked ? theme.colors.primary : theme.colors.subtext} />
          <Text style={[styles.statText, { color: theme.colors.subtext }]}>
            {prompt.likesCount || 0} Likes
          </Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="comment-outline" size={18} color={theme.colors.subtext} />
          <Text style={[styles.statText, { color: theme.colors.subtext }]}>
            {prompt.commentsCount || 0} Kommentare
          </Text>
        </View>
      </View>

      <Divider style={[styles.divider, { backgroundColor: theme.colors.divider }]} />

      {/* Bewertungskomponente */}
      <RatingCard
        promptId={promptId || ''}
        averageRating={prompt.averageRating || 0}
        ratingsCount={prompt.ratingsCount || 0}
        onRatingChange={handleRatingChange}
      />

      {/* Kommentare */}
      <CommentSection promptId={promptId || ''} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  premiumBadge: {
    borderWidth: 2,
    height: 28,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  authorSubtext: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 4,
  },
  ratingCount: {
    fontSize: 14,
    opacity: 0.7,
  },
  followButton: {
    alignSelf: 'flex-start',
  },
  divider: {
    marginVertical: 16,
  },
  contentSection: {
    marginBottom: 24,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  promptBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  promptText: {
    fontSize: 16,
    lineHeight: 24,
  },
  createdAtContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createdAtText: {
    fontSize: 12,
    marginLeft: 4,
  },
  tagsContainer: {
    marginBottom: 24,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    marginVertical: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statIcon: {
    marginRight: 4,
  },
  statText: {
    fontSize: 14,
    marginLeft: 4,
  },
});

export default PromptDetailScreen;
