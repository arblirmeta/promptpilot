import React, { useState, useCallback } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { Prompt } from '../models/Prompt';
import { auth, firestore, collection, query, where, getDocs } from '../config/firebase';
import PromptList from '../components/PromptList';
import { HomeScreenNavigationProp } from '../navigation/navigationTypes';
import EmptyState from '../components/EmptyState';

type MyPromptsScreenProps = {
  navigation: HomeScreenNavigationProp;
};

const MyPromptsScreen = ({ navigation }: MyPromptsScreenProps) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const insets = { top: 60 }; // Berücksichtigung des Statusbars/SafeArea

  // Funktion zum Abrufen der eigenen Prompts
  const fetchMyPrompts = useCallback(async (): Promise<Prompt[]> => {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      setIsLoading(true);

      // Abfrage für Prompts, bei denen der aktuelle Benutzer der Autor ist
      const promptsQuery = query(
        collection(firestore, 'prompts'),
        where('userId', '==', user.uid)
      );

      const promptsSnapshot = await getDocs(promptsQuery);
      const promptsList: Prompt[] = [];

      promptsSnapshot.forEach((doc) => {
        // Typsicherheit mit dem PromptData-Interface
        const promptData: any = {
          id: doc.id,
          ...doc.data()
        };
        
        // Füge das userId-Feld hinzu, falls es nicht existiert
        if (!promptData.userId) {
          promptData.userId = user.uid;
        }
        // Füge das userDisplayName-Feld hinzu, falls es nicht existiert
        if (!promptData.userDisplayName) {
          promptData.userDisplayName = user.displayName || '';
        }
        // Füge das userProfileImage-Feld hinzu, falls es nicht existiert
        if (!promptData.userProfileImage) {
          promptData.userProfileImage = user.photoURL || '';
        }
        
        // Konvertiere in das Prompt-Format mit dem richtigen Konverter
        const prompt = { ...promptData };
        promptsList.push(prompt);
      });

      return promptsList;
    } catch (error) {
      console.error('Fehler beim Laden der eigenen Prompts:', error);
      return [];
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Behandle die Aktualisierung
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMyPrompts().then(() => setRefreshing(false));
  }, [fetchMyPrompts]);

  // Navigiere zur Prompt-Detail-Ansicht
  const handlePromptPress = useCallback((prompt: Prompt) => {
    navigation.navigate('PromptDetail', { promptId: prompt.id });
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header mit Abstand für die StatusBar */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Meine Prompts</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <PromptList
          fetchPrompts={fetchMyPrompts}
          emptyTitle="Keine eigenen Prompts"
          emptyDescription="Du hast noch keine Prompts erstellt. Tippe auf das + Symbol unten, um deinen ersten Prompt zu erstellen."
          cacheKey="myPrompts"
          onPromptPress={handlePromptPress}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    // Füge Tiefe durch Schatten hinzu
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MyPromptsScreen;
