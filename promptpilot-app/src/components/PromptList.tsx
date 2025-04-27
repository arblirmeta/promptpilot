import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, RefreshControl, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import PromptCard from '../components/PromptCard';
import EmptyState from '../components/EmptyState';
import { Prompt } from '../models/Prompt';
import { CacheManager, debounce } from '../utils/PerformanceOptimizer';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface PromptListProps {
  fetchPrompts: () => Promise<Prompt[]>;
  emptyTitle: string;
  emptyDescription?: string;
  cacheKey?: string;
  onPromptPress?: (prompt: Prompt) => void;
}

const PromptList: React.FC<PromptListProps> = ({
  fetchPrompts,
  emptyTitle,
  emptyDescription,
  cacheKey,
  onPromptPress,
}) => {
  const { theme } = useTheme();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const cache = CacheManager.getInstance();
  
  const loadPrompts = useCallback(async (useCache = true) => {
    try {
      setError(null);
      
      // Versuche, Daten aus dem Cache zu laden, wenn erlaubt
      if (useCache && cacheKey) {
        const cachedData = cache.get<Prompt[]>(cacheKey);
        if (cachedData) {
          setPrompts(cachedData);
          setIsLoading(false);
          return;
        }
      }
      
      // Lade Daten vom Server
      const data = await fetchPrompts();
      
      // Speichere Daten im Cache, wenn ein Schlüssel angegeben ist
      if (cacheKey) {
        cache.set(cacheKey, data, 5); // 5 Minuten Cache-Dauer
      }
      
      setPrompts(data);
    } catch (e) {
      console.error('Fehler beim Laden der Prompts:', e);
      setError('Fehler beim Laden der Daten. Bitte versuche es später erneut.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fetchPrompts, cacheKey]);
  
  // Lade Prompts beim ersten Rendern
  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);
  
  // Behandle Pull-to-Refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadPrompts(false); // Ignoriere Cache beim Aktualisieren
  }, [loadPrompts]);
  
  // Optimierte Render-Funktion für Listenelemente
  const renderItem = useCallback(({ item }: { item: Prompt }) => (
    <PromptCard
      id={item.id}
      title={item.title}
      content={item.content}
      category={item.category}
      tags={item.tags}
      authorId={item.authorId}
      authorName={item.authorName}
      authorImageUrl={item.authorImageUrl}
      likesCount={item.likesCount}
      viewsCount={item.viewsCount}
      commentsCount={item.commentsCount}
      averageRating={item.averageRating}
      ratingCount={item.ratingCount}
      createdAt={item.createdAt}
      updatedAt={item.updatedAt}
      isPremium={item?.isPremium}
      onPress={() => onPromptPress && onPromptPress(item)}
    />
  ), [onPromptPress]);
  
  // Optimierte Schlüsselfunktion für Listenelemente
  const keyExtractor = useCallback((item: Prompt) => item.id, []);
  
  // Debounced Scroll-Event-Handler
  const handleScroll = debounce(() => {
    // Hier könnten zusätzliche Scroll-Logik implementiert werden
    // z.B. Lazy Loading weiterer Daten
  }, 200);
  
  if (isLoading && !isRefreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Inhalte werden geladen...</Text>
        </View>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          title="Fehler"
          description={error}
          actionLabel="Erneut versuchen"
          onAction={handleRefresh}
        />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={prompts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onScroll={handleScroll}
        removeClippedSubviews={true} // Verbessert die Leistung, indem nicht sichtbare Komponenten aus dem Speicher entfernt werden
        maxToRenderPerBatch={10} // Begrenzt die Anzahl der gleichzeitig gerenderten Elemente
        windowSize={5} // Reduziert die Anzahl der im Speicher gehaltenen Elemente
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          isRefreshing ? null : (
            <View style={styles.headerContainer}>
              <MaterialCommunityIcons name="format-list-bulleted" size={16} color={theme.colors.subtext} />
              <Text style={[styles.headerText, { color: theme.colors.subtext }]}>
                {prompts.length} Prompts gefunden
              </Text>
            </View>
          )
        }
        ListEmptyComponent={
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionLabel="Aktualisieren"
            onAction={handleRefresh}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 12,
    paddingTop: 8,
    paddingBottom: 100, // Extra-Abstand am Ende der Liste für bessere Benutzerfreundlichkeit
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  separator: {
    height: 8, // Kleinerer Abstand zwischen Elementen für ein moderneres Design
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
});

export default React.memo(PromptList); // Verwende React.memo für zusätzliche Leistungsoptimierung
