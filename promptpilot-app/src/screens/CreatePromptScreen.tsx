import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { firestore, auth } from '../config/firebase';
import { doc, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
// Wir verwenden inline-Kategorien anstelle einer separaten Komponente

interface CreatePromptScreenProps {
  navigation: any;
}

const CATEGORIES = [
  'Softwareentwicklung',
  'Bildung',
  'Kreatives Schreiben',
  'Marketing',
  'Wissenschaft',
  'Persönliche Entwicklung',
  'Sonstiges'
];

const CreatePromptScreen: React.FC<CreatePromptScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = { top: 60 }; // Berücksichtigung der StatusBar-Höhe
  
  const [title, setTitle] = useState('');
  const [promptText, setPromptText] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tag Funktionen
  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Prompt speichern
  const savePrompt = async () => {
    // Validierung
    if (!title.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Titel ein');
      return;
    }

    if (!promptText.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Prompt-Text ein');
      return;
    }

    if (!category) {
      Alert.alert('Fehler', 'Bitte wähle eine Kategorie aus');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Fehler', 'Du musst angemeldet sein, um Prompts zu erstellen');
      return;
    }

    setIsSubmitting(true);

    try {
      // Benutzerinformationen für den Autor abrufen
      const userDocRef = doc(firestore, 'userProfiles', currentUser.uid);
      const userSnapshot = await getDoc(userDocRef);
      const userData = userSnapshot.exists() ? userSnapshot.data() : {};
      
      // Aktuelles Datum als String für createdAt und lastModified
      const now = new Date().toISOString();
      
      // Neuen Prompt in Firestore hinzufügen
      const promptsCollection = collection(firestore, 'prompts');
      const newPromptRef = await addDoc(promptsCollection, {
        title: title.trim(),
        text: promptText.trim(), // Verwende text wie in der bestehenden Datenbank
        description: description.trim(),
        category,
        tags,
        
        // Autor-Informationen
        userId: currentUser.uid,
        userDisplayName: userData.displayName || currentUser.displayName || 'Anonym',
        userProfileImage: userData.photoURL || '',
        
        // Zähler
        likesCount: 0,
        commentsCount: 0,
        viewsCount: 0,
        rating: 0,
        ratingsCount: 0,
        likedByUsers: [],
        
        // Status
        isPublic: true,
        isFeatured: false,
        
        // Zeitstempel
        createdAt: now,
        lastModified: now,
        updatedAt: serverTimestamp() // Für die automatische Aktualisierung
      });

      console.log('Prompt erfolgreich erstellt mit ID:', newPromptRef.id);
      Alert.alert(
        'Erfolg',
        'Dein Prompt wurde erfolgreich erstellt!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('PromptDetail', { promptId: newPromptRef.id })
          }
        ]
      );
    } catch (error) {
      console.error('Fehler beim Erstellen des Prompts:', error);
      Alert.alert('Fehler', 'Beim Erstellen des Prompts ist ein Fehler aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top }]}
      >
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>Neuen Prompt erstellen</Text>
        </View>
        
        {/* Titel */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Titel *</Text>
          <TextInput
            mode="outlined"
            placeholder="Ein aussagekräftiger Titel"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            maxLength={100}
          />
        </View>
        
        {/* Prompt Text */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Prompt Text *</Text>
          <TextInput
            mode="outlined"
            placeholder="Der eigentliche Prompt-Text, der verwendet werden soll"
            value={promptText}
            onChangeText={setPromptText}
            multiline
            numberOfLines={6}
            style={[styles.input, styles.textArea]}
            maxLength={2000}
          />
          <Text style={[styles.characterCount, { color: colors.subtext }]}>
            {promptText.length}/2000 Zeichen
          </Text>
        </View>
        
        {/* Beschreibung */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Beschreibung</Text>
          <TextInput
            mode="outlined"
            placeholder="Eine kurze Beschreibung deines Prompts (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]}
            maxLength={500}
          />
          <Text style={[styles.characterCount, { color: colors.subtext }]}>
            {description.length}/500 Zeichen
          </Text>
        </View>
        
        {/* Kategorie */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Kategorie *</Text>
          <View style={styles.categoriesContainer}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text 
                  style={[
                    styles.categoryLabel, 
                    { color: category === cat ? colors.primary : colors.text }
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Tags */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Tags</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              mode="outlined"
              placeholder="Tag hinzufügen (z.B. GPT-4, Kreativ, Coding)"
              value={tagInput}
              onChangeText={setTagInput}
              style={[styles.input, { flex: 1 }]}
              onSubmitEditing={addTag}
            />
            <Button
              mode="contained"
              onPress={addTag}
              style={styles.addTagButton}
              disabled={!tagInput.trim()}
            >
              Hinzufügen
            </Button>
          </View>
          
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  style={styles.tagChip}
                  onClose={() => removeTag(tag)}
                >
                  {tag}
                </Chip>
              ))}
            </View>
          )}
        </View>
        
        <Divider style={styles.divider} />
        
        {/* Aktions-Buttons */}
        <View style={styles.actionButtonsContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.actionButton}
          >
            Abbrechen
          </Button>
          <Button
            mode="contained"
            onPress={savePrompt}
            style={styles.actionButton}
            disabled={isSubmitting || !title.trim() || !promptText.trim() || !category}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.surface} size="small" />
            ) : (
              'Prompt erstellen'
            )}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 120, // Mehr Platz für die größere Bottom-Navigation
  },
  header: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    // Schatteneffekt für visuelle Tiefe
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'transparent',
  },
  textArea: {
    minHeight: 100,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 14,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTagButton: {
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tagChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default CreatePromptScreen;
