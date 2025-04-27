import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeScreenNavigationProp } from '../navigation/navigationTypes';
import { useTheme } from '../theme/ThemeContext';
import { PerformanceMonitor } from '../utils/PerformanceOptimizer';
import { firestore, collection, getDocs, query, where, orderBy, limit as firestoreLimit, type QueryDocumentSnapshot, type DocumentData } from '../config/firebase';
import { Prompt, PromptData, convertToPrompt } from '../models/Prompt';
import PromptList from '../components/PromptList';
import TabBar from '../components/TabBar';

const HomeScreen: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = { top: 20 }; // Minimaler Abstand für die StatusBar
  const performanceMonitor = PerformanceMonitor.getInstance();
  
  // Tabs für die verschiedenen Prompt-Kategorien mit passenden Icons
  const tabs = ['Neueste', 'Beliebt', 'Für dich'];
  const icons = ['clock-outline', 'star-outline', 'lightning-bolt-outline'];
  
  // Fetch-Funktionen für die verschiedenen Tabs
  const fetchLatestPrompts = useCallback(async (): Promise<Prompt[]> => {
    performanceMonitor.startMeasure('fetchLatestPrompts');
    
    try {
      const promptsRef = collection(firestore, 'prompts');
      // Nur öffentliche Prompts anzeigen
      const promptsQuery = query(
        promptsRef, 
        where('isPublic', '!=', false), // öffentliche Prompts (undefined oder true)
        orderBy('isPublic'), // Notwendig für Firestore-Abfragen mit where und orderBy
        orderBy('createdAt', 'desc'), 
        firestoreLimit(20)
      );
      const snapshot = await getDocs(promptsQuery);
      
      const prompts = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data() as PromptData;
        // Wenn data bereits eine id-Eigenschaft hat, sollten wir sie nicht überschreiben
        return convertToPrompt({
          ...data,
          id: doc.id
        });
      });
      
      performanceMonitor.endMeasure('fetchLatestPrompts');
      return prompts;
    } catch (error) {
      console.error('Fehler beim Laden der neuesten Prompts:', error);
      performanceMonitor.endMeasure('fetchLatestPrompts');
      throw error;
    }
  }, []);
  
  const fetchPopularPrompts = useCallback(async (): Promise<Prompt[]> => {
    performanceMonitor.startMeasure('fetchPopularPrompts');
    
    try {
      const promptsRef = collection(firestore, 'prompts');
      // Nur öffentliche Prompts anzeigen, sortiert nach Likes
      const promptsQuery = query(
        promptsRef, 
        where('isPublic', '!=', false),
        orderBy('isPublic'),
        orderBy('likesCount', 'desc'), 
        firestoreLimit(20)
      );
      const snapshot = await getDocs(promptsQuery);
      
      const prompts = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data() as PromptData;
        // Wenn data bereits eine id-Eigenschaft hat, sollten wir sie nicht überschreiben
        return convertToPrompt({
          ...data,
          id: doc.id
        });
      });
      
      performanceMonitor.endMeasure('fetchPopularPrompts');
      return prompts;
    } catch (error) {
      console.error('Fehler beim Laden der beliebten Prompts:', error);
      performanceMonitor.endMeasure('fetchPopularPrompts');
      throw error;
    }
  }, []);
  
  const fetchPersonalizedPrompts = useCallback(async (): Promise<Prompt[]> => {
    performanceMonitor.startMeasure('fetchPersonalizedPrompts');
    
    try {
      // Hier würde die Logik für personalisierte Empfehlungen stehen
      // Für diese Demo zeigen wir eine Mischung aus beliebten und gut bewerteten Prompts
      const promptsRef = collection(firestore, 'prompts');
      const promptsQuery = query(
        promptsRef, 
        where('isPublic', '!=', false),
        orderBy('isPublic'),
        orderBy('averageRating', 'desc'), // Nach Bewertung sortieren
        firestoreLimit(20)
      );
      const snapshot = await getDocs(promptsQuery);
      
      const prompts = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data() as PromptData;
        // Wenn data bereits eine id-Eigenschaft hat, sollten wir sie nicht überschreiben
        return convertToPrompt({
          ...data,
          id: doc.id
        });
      });
      
      performanceMonitor.endMeasure('fetchPersonalizedPrompts');
      return prompts;
    } catch (error) {
      console.error('Fehler beim Laden der personalisierten Prompts:', error);
      performanceMonitor.endMeasure('fetchPersonalizedPrompts');
      throw error;
    }
  }, []);
  
  // Handler für Tab-Wechsel
  const handleTabChange = useCallback((index: number) => {
    setActiveTab(index);
  }, []);
  
  // Callback für das Drücken auf einen Prompt
  const handlePromptPress = useCallback((prompt: Prompt) => {
    // Navigation zur Prompt-Detail-Ansicht
    console.log('Prompt ausgewählt:', prompt.id);
    // Typsicherer Navigationsaufruf
    if (prompt.id) {
      // @ts-ignore - Ignoriere den Typfehler, da wir wissen dass diese Route existiert
      navigation.navigate('PromptDetail', { promptId: prompt.id });
    } else {
      console.error('Fehler: Prompt ID ist undefined');
    }
    
    // Zugriffszahlen erhöhen (optional in einer späteren Version)
    // incrementViewCount(prompt.id);
  }, [navigation]);
  
  // Render-Funktion für den aktiven Tab-Inhalt
  const renderActiveTabContent = useCallback(() => {
    switch (activeTab) {
      case 0:
        return (
          <PromptList
            fetchPrompts={fetchLatestPrompts}
            emptyTitle="Keine Prompts gefunden"
            emptyDescription="Es wurden keine Prompts gefunden. Versuche es später erneut."
            cacheKey="latest_prompts"
            onPromptPress={handlePromptPress}
          />
        );
      case 1:
        return (
          <PromptList
            fetchPrompts={fetchPopularPrompts}
            emptyTitle="Keine beliebten Prompts"
            emptyDescription="Es wurden keine beliebten Prompts gefunden."
            cacheKey="popular_prompts"
            onPromptPress={handlePromptPress}
          />
        );
      case 2:
        return (
          <PromptList
            fetchPrompts={fetchPersonalizedPrompts}
            emptyTitle="Keine Empfehlungen"
            emptyDescription="Wir konnten keine personalisierten Empfehlungen für dich finden."
            cacheKey="personalized_prompts"
            onPromptPress={handlePromptPress}
          />
        );
      default:
        return null;
    }
  }, [activeTab, fetchLatestPrompts, fetchPopularPrompts, fetchPersonalizedPrompts, handlePromptPress]);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
      
      {/* PromptPilot Logo Header mit Dark Mode Toggle */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerLogo, { color: theme.colors.primary }]}>Prompt<Text style={{ fontWeight: 'bold', color: isDark ? '#FFFFFF' : '#000000' }}>Pilot</Text></Text>
          
          {/* Dark Mode Toggle Button */}
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={() => toggleTheme()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isDark ? 'weather-sunny' : 'weather-night'}
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Tab-Bar zur Navigation zwischen den verschiedenen Prompt-Listen */}
      <TabBar
        tabs={tabs}
        icons={icons}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        elevated
      />
      
      {/* Aktuell ausgewählter Tab-Inhalt */}
      {renderActiveTabContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    width: '100%',
  },
  themeToggle: {
    padding: 8,
    borderRadius: 20,
  },
  headerLogo: {
    fontSize: 28,
    fontWeight: '500',
    letterSpacing: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
});

export default React.memo(HomeScreen);
