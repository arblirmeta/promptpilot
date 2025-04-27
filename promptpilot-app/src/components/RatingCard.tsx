import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Divider } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import StarRating from './StarRating';
import RatingService from '../services/RatingService';
import { auth } from '../config/firebase';

interface RatingCardProps {
  promptId: string;
  averageRating?: number;
  ratingsCount?: number;
  onRatingChange?: (newRating: number) => void;
}

const RatingCard: React.FC<RatingCardProps> = ({
  promptId,
  averageRating = 0,
  ratingsCount = 0,
  onRatingChange,
}) => {
  const { theme } = useTheme();
  const [userRating, setUserRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasRated, setHasRated] = useState<boolean>(false);
  
  // Lade die Bewertung des aktuellen Benutzers, wenn vorhanden
  useEffect(() => {
    const loadUserRating = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        
        const rating = await RatingService.getUserRating(currentUser.uid, promptId);
        if (rating) {
          setUserRating(rating.ratingValue);
          setHasRated(true);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Benutzerbewertung:', error);
      }
    };
    
    loadUserRating();
  }, [promptId]);
  
  // Bewertung abgeben oder aktualisieren
  const handleRatingChange = async (rating: number) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert(
          'Anmeldung erforderlich',
          'Du musst angemeldet sein, um eine Bewertung abzugeben.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      setIsSubmitting(true);
      
      await RatingService.ratePrompt(currentUser.uid, promptId, rating);
      
      setUserRating(rating);
      setHasRated(true);
      
      // Benachrichtige den übergeordneten Komponenten über die Änderung
      if (onRatingChange) {
        onRatingChange(rating);
      }
      
      Alert.alert(
        'Bewertung gespeichert',
        hasRated ? 'Deine Bewertung wurde aktualisiert.' : 'Deine Bewertung wurde gespeichert.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Fehler beim Bewerten:', error);
      Alert.alert(
        'Fehler',
        'Beim Speichern deiner Bewertung ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Bewertung löschen
  const handleDeleteRating = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      Alert.alert(
        'Bewertung löschen',
        'Möchtest du deine Bewertung wirklich löschen?',
        [
          { text: 'Abbrechen', style: 'cancel' },
          {
            text: 'Löschen',
            style: 'destructive',
            onPress: async () => {
              setIsSubmitting(true);
              
              await RatingService.deleteRating(currentUser.uid, promptId);
              
              setUserRating(0);
              setHasRated(false);
              
              // Benachrichtige den übergeordneten Komponenten über die Änderung
              if (onRatingChange) {
                onRatingChange(0);
              }
              
              Alert.alert(
                'Bewertung gelöscht',
                'Deine Bewertung wurde erfolgreich gelöscht.',
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error('Fehler beim Löschen der Bewertung:', error);
      Alert.alert(
        'Fehler',
        'Beim Löschen deiner Bewertung ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.card }]}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Bewertungen
          </Text>
          <View style={styles.averageContainer}>
            <StarRating
              rating={averageRating}
              size={16}
              readonly={true}
            />
            <Text style={[styles.averageText, { color: theme.colors.subtext }]}>
              ({averageRating.toFixed(1)}) {ratingsCount} {ratingsCount === 1 ? 'Bewertung' : 'Bewertungen'}
            </Text>
          </View>
        </View>
        
        <Divider style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
        
        <View style={styles.userRatingContainer}>
          <Text style={[styles.userRatingTitle, { color: theme.colors.text }]}>
            {hasRated ? 'Deine Bewertung' : 'Bewerte diesen Prompt'}
          </Text>
          
          <View style={styles.ratingControls}>
            <StarRating
              rating={userRating}
              size={32}
              spacing={4}
              readonly={isSubmitting}
              onRatingChange={handleRatingChange}
            />
            
            {hasRated && (
              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  { backgroundColor: theme.colors.error + '20' }
                ]}
                onPress={handleDeleteRating}
                disabled={isSubmitting}
              >
                <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>
                  Löschen
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  averageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  averageText: {
    marginLeft: 8,
    fontSize: 14,
  },
  divider: {
    marginVertical: 12,
  },
  userRatingContainer: {
    marginTop: 8,
  },
  userRatingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  ratingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default RatingCard;
