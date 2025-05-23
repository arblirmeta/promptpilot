import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { PerformanceMonitor, CacheManager, debounce } from '../utils/PerformanceOptimizer';
import { firestore, collection, getDocs, query as firestoreQuery, where, orderBy, limit as firestoreLimit, type QuerySnapshot, type DocumentData } from '../config/firebase';
import { Prompt, PromptData, convertToPrompt } from '../models/Prompt';
import PromptCard from '../components/PromptCard';
import EmptyState from '../components/EmptyState';
import Input from '../components/Input';
import Button from '../components/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Define a type for the expected route params
type SearchScreenRouteParams = {
  query?: string;
};

const SORT_OPTIONS = [
  { label: 'Relevance', field: null, direction: null },
  { label: 'Newest', field: 'createdAt', direction: 'desc' },
  { label: 'Oldest', field: 'createdAt', direction: 'asc' },
  { label: 'Most Liked', field: 'likesCount', direction: 'desc' },
  { label: 'Most Viewed', field: 'viewsCount', direction: 'desc' },
  { label: 'Highest Rated', field: 'averageRating', direction: 'desc' },
] as const; // Use 'as const' for better type inference if needed, or define a specific type

// Define a type for a single sort option for clarity
type SortOption = typeof SORT_OPTIONS[number];

const SearchScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params: SearchScreenRouteParams }, string>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSort, setCurrentSort] = useState<SortOption>(SORT_OPTIONS[0]);
  const [searchResults, setSearchResults] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popularCategories] = useState(['ChatGPT', 'Midjourney', 'DALL-E', 'Business', 'Coding', 'Education']);
  const [popularTags] = useState(['KI', 'Kreativität', 'Produktivität', 'Lernen', 'Marketing', 'Design']);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const insets = { top: 60 }; // Berücksichtigung des Statusbars/SafeArea
  
  const performanceMonitor = PerformanceMonitor.getInstance();
  const cache = CacheManager.getInstance();
  
  // Funktion zum Speichern von Suchbegriffen
  const saveSearchQuery = useCallback((query: string) => {
    if (query.trim() && !recentSearches.includes(query.trim())) {
      // Maximal 5 Suchbegriffe speichern
      const updatedSearches = [query.trim(), ...recentSearches.slice(0, 4)];
      setRecentSearches(updatedSearches);
    }
  }, [recentSearches]);

  // Optimierte Suche mit Debounce
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      performanceMonitor.startMeasure('searchPrompts');
      setIsLoading(true);
      setError(null);

      try {
        const cacheKey = `search_${query.toLowerCase()}_sort_${currentSort.field}_${currentSort.direction}`;
        const cachedResults = cache.get<Prompt[]>(cacheKey);

        if (cachedResults) {
          setSearchResults(cachedResults);
          setIsLoading(false);
          performanceMonitor.endMeasure('searchPrompts');
          return;
        }

        const queryLower = query.toLowerCase();
        const promptsRef = collection(firestore, 'prompts');
        console.log('Serversuche nach:', queryLower, 'Sortierung:', currentSort.label);

        // Base queries
        let tagsBaseQuery = firestoreQuery(
          promptsRef,
          where('tags', 'array-contains', queryLower)
        );
        let categoryBaseQuery = firestoreQuery(
          promptsRef,
          where('category', '==', queryLower)
        );
        let titleBaseQuery = firestoreQuery(
          promptsRef,
          where('title', '>=', queryLower),
          where('title', '<=', queryLower + '\uf8ff')
        );

        // Apply sorting if a sort field is specified
        if (currentSort.field && currentSort.direction) {
          tagsBaseQuery = firestoreQuery(tagsBaseQuery, orderBy(currentSort.field, currentSort.direction));
          categoryBaseQuery = firestoreQuery(categoryBaseQuery, orderBy(currentSort.field, currentSort.direction));
          titleBaseQuery = firestoreQuery(titleBaseQuery, orderBy(currentSort.field, currentSort.direction));
        }

        // Apply limit after sorting
        const tagsFinalQuery = firestoreQuery(tagsBaseQuery, firestoreLimit(15));
        const categoryFinalQuery = firestoreQuery(categoryBaseQuery, firestoreLimit(15));
        const titleFinalQuery = firestoreQuery(titleBaseQuery, firestoreLimit(15));
        
        const [tagsSnapshot, categorySnapshot, titleSnapshot] = await Promise.all([
          getDocs(tagsFinalQuery),
          getDocs(categoryFinalQuery),
          getDocs(titleFinalQuery),
        ]);

        const fetchedPrompts: Prompt[] = [];
        const promptIds = new Set<string>();

        // Helper function to process each snapshot and add unique prompts
        const processSnapshot = (snapshot: QuerySnapshot<DocumentData>) => {
          snapshot.docs.forEach(doc => {
            const prompt = convertToPrompt({ ...(doc.data() as PromptData), id: doc.id });
            if (prompt.id && !promptIds.has(prompt.id)) { // Ensure prompt.id is not null and is unique
              fetchedPrompts.push(prompt);
              promptIds.add(prompt.id);
            }
          });
        };

        processSnapshot(tagsSnapshot);
        processSnapshot(categorySnapshot);
        processSnapshot(titleSnapshot);
        
        console.log('Gefilterte Ergebnisse (Server):', fetchedPrompts.length);
        
        cache.set(cacheKey, fetchedPrompts, 5); // 5 Minuten Cache-Dauer
        saveSearchQuery(query); // Save search query after successful search
        setSearchResults(fetchedPrompts);

      } catch (error: any) { 
        console.error('Fehler bei der Suche:', error);
        if (error.code && error.code === 'failed-precondition') {
             setError('Die Suche erfordert möglicherweise einen Index. Bitte kontaktieren Sie den Support oder versuchen Sie eine andere Suchanfrage.');
        } else {
            setError('Bei der Suche ist ein Fehler aufgetreten. Bitte versuche es später erneut.');
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        performanceMonitor.endMeasure('searchPrompts');
      }
    }, 400),
    [saveSearchQuery, cache, performanceMonitor] // Added cache and performanceMonitor to dependency array
  );
  
  // Führe die Suche aus, wenn sich die Suchanfrage oder Sortierung ändert
  useEffect(() => {
    // Nur ausführen, wenn searchQuery nicht leer ist, um unnötige Suchen beim Start zu vermeiden,
    // es sei denn, eine initiale Query kommt von den Route-Parametern.
    if (searchQuery.trim() || route.params?.query) {
        debouncedSearch(searchQuery);
    } else {
        setSearchResults([]); // Clear results if search query is cleared and no initial param
    }
  }, [searchQuery, debouncedSearch, currentSort, route.params?.query]);

  // Effect to handle incoming query parameter from navigation
  useEffect(() => {
    const initialQuery = route.params?.query;
    if (initialQuery && typeof initialQuery === 'string' && initialQuery !== searchQuery) {
      setSearchQuery(initialQuery);
    }
    // Only re-run if route.params.query changes. Avoid re-running on searchQuery change from this effect.
  }, [route.params?.query]); 
  
  // Handler für Änderungen der Suchanfrage
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);
  
  // Handler für Klick auf Kategorie oder Tag
  const handleFilterClick = useCallback((filter: string) => {
    setSearchQuery(filter);
  }, []);
  
  // Handler für Pull-to-Refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);
  
  // Handler für Prompt-Auswahl
  const handlePromptPress = useCallback((prompt: Prompt) => {
    // Navigation zur Prompt-Detail-Ansicht
    console.log('Prompt ausgewählt:', prompt.id);
    if (prompt.id) {
      // @ts-ignore - Ignoriere den Typfehler, da wir wissen dass diese Route existiert
      navigation.navigate('PromptDetail', { promptId: prompt.id });
    }
  }, [navigation]);
  
  // Memoized Render-Funktion für Listenelemente
  const renderItem = useCallback(({ item }: { item: Prompt }) => (
    <PromptCard
      title={item.title}
      content={item.content}
      category={item.category}
      tags={item.tags}
      authorName={item.authorName}
      authorImageUrl={item.authorImageUrl}
      likesCount={item.likesCount}
      viewsCount={item.viewsCount}
      commentsCount={item.commentsCount}
      averageRating={item.averageRating}
      onPress={() => handlePromptPress(item)}
    />
  ), [handlePromptPress]);
  
  // Optimierte Schlüsselfunktion für Listenelemente
  const keyExtractor = useCallback((item: Prompt) => item.id, []);
  
  // Memoized Empty State
  const emptyState = useMemo(() => {
    if (isLoading && !isRefreshing) {
      return <EmptyState title="Suche..." />;
    }
    
    if (error) {
      return (
        <EmptyState
          title="Fehler"
          description={error}
          actionLabel="Erneut versuchen"
          onAction={handleRefresh}
        />
      );
    }
    
    if (searchQuery.trim() && searchResults.length === 0) {
      return (
        <EmptyState
          title="Keine Ergebnisse"
          description={`Keine Ergebnisse für "${searchQuery}" gefunden.`}
        />
      );
    }
    
    if (!searchQuery.trim()) {
      return (
        <EmptyState
          title="Suche nach Prompts"
          description="Gib einen Suchbegriff ein, um Prompts zu finden."
        />
      );
    }
    
    return null;
  }, [isLoading, isRefreshing, error, searchQuery, searchResults.length, handleRefresh]);
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.searchContainer, { paddingTop: insets.top, backgroundColor: theme.colors.surface }]}>
        <View style={styles.searchInputWrapper}>
          <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.primary} style={styles.searchIcon} />
          <Input
            placeholder="Suche nach Prompts..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            containerStyle={styles.searchInputContainer}
          />
          {searchQuery.trim() && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Sorting UI - only shown when there is a search query */}
        {searchQuery.trim() && (
          <View style={styles.sortingContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortingContentContainer}>
              {SORT_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.sortChip,
                    { 
                      backgroundColor: option.label === currentSort.label ? theme.colors.primary : theme.colors.surface,
                      borderColor: option.label === currentSort.label ? theme.colors.primary : theme.colors.border,
                    }
                  ]}
                  onPress={() => setCurrentSort(option)}
                >
                  <Text style={[
                    styles.sortChipText,
                    { color: option.label === currentSort.label ? theme.colors.onPrimary : theme.colors.text }
                  ]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
      
      {!searchQuery.trim() ? (
        <ScrollView style={styles.suggestionsContainer} contentContainerStyle={styles.suggestionsContent}>
          {/* Letzte Suchen */}
          {recentSearches.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Letzte Suchen</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
                {recentSearches.map((term, index) => (
                  <TouchableOpacity 
                    key={`recent-${index}`}
                    style={[styles.filterChip, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}
                    onPress={() => handleFilterClick(term)}
                  >
                    <Text style={[styles.filterChipText, { color: theme.colors.text }]}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Beliebte Kategorien */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Beliebte Kategorien</Text>
            <View style={styles.categoriesGrid}>
              {popularCategories.map((category, index) => (
                <TouchableOpacity 
                  key={`category-${index}`}
                  style={[styles.categoryCard, { backgroundColor: isDark ? '#222' : '#fff' }]}
                  onPress={() => handleFilterClick(category)}
                >
                  <Text style={[styles.categoryText, { color: theme.colors.primary }]}>{category}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Beliebte Tags */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Beliebte Tags</Text>
            <View style={styles.tagContainer}>
              {popularTags.map((tag, index) => (
                <TouchableOpacity 
                  key={`tag-${index}`}
                  style={[styles.tagChip, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}
                  onPress={() => handleFilterClick(tag)}
                >
                  <Text style={[styles.tagText, { color: theme.colors.text }]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={searchResults}
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
          ListEmptyComponent={emptyState}
          ListHeaderComponent={isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.text }]}>Suche läuft...</Text>
            </View>
          ) : null}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 12,
    // Schatten für einen elevierten Look
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border, // Use theme color
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundVariant, // Use theme color
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInputContainer: {
    flex: 1,
    marginBottom: 0,
    paddingLeft: 0,
  },
  clearButton: {
    padding: 5,
  },
  suggestionsContainer: {
    flex: 1,
  },
  suggestionsContent: {
    padding: 16,
    paddingBottom: 120, // Extra Platz für die Tab-Navigation
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  tagText: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 120, // Extra Platz für die Tab-Navigation
    flexGrow: 1,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  sortingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface, // Match search container bg
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sortingContentContainer: {
    paddingVertical: 4,
  },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  // sortChipActive is now handled inline with conditional styling for simplicity with theme
  sortChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // sortChipTextActive is also handled inline
});

export default React.memo(SearchScreen);
