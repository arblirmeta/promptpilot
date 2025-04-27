import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput as RNTextInput } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import ProfileAvatar from '../components/ProfileAvatar';
import Input from '../components/Input';
import { auth } from '../config/firebase';
import UserProfileService from '../services/UserProfileService';
import { UserProfile } from '../models/UserProfile';
import * as ImagePicker from 'expo-image-picker';
import ImageService from '../services/ImageService';

interface ProfileEditScreenProps {
  route: {
    params: {
      profile: UserProfile;
    };
  };
  navigation: any;
}

const ProfileEditScreen: React.FC<ProfileEditScreenProps> = ({ route, navigation }) => {
  const { profile } = route.params;
  const { theme } = useTheme();
  
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [username, setUsername] = useState(profile.username || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [website, setWebsite] = useState(profile.links?.website || '');
  const [twitter, setTwitter] = useState(profile.links?.twitter || '');
  const [github, setGithub] = useState(profile.links?.github || '');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);
  const [photoURL, setPhotoURL] = useState(profile.photoURL || '');
  
  // Profilbild ändern
  const handleChangeProfileImage = async () => {
    try {
      // Berechtigungen anfordern
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Wir benötigen die Berechtigung, auf deine Fotos zuzugreifen');
        return;
      }
      
      // Bild auswählen
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUpdatingImage(true);
        
        const imageUri = result.assets[0].uri;
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          throw new Error('Nicht angemeldet');
        }
        
        // Bild hochladen
        const downloadURL = await ImageService.uploadProfileImage(currentUser.uid, imageUri);
        
        // Lokalen Zustand aktualisieren
        setPhotoURL(downloadURL);
      }
    } catch (error) {
      console.error('Fehler beim Ändern des Profilbilds:', error);
      alert('Beim Ändern des Profilbilds ist ein Fehler aufgetreten');
    } finally {
      setIsUpdatingImage(false);
    }
  };
  
  // Profil speichern
  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Nicht angemeldet');
      }
      
      // Aktualisiere das Profil
      await UserProfileService.updateUserProfile(currentUser.uid, {
        displayName,
        username,
        bio,
        photoURL,
        links: {
          website,
          twitter,
          github
        }
      });
      
      // Zurück zum Profil navigieren
      navigation.goBack();
    } catch (error) {
      console.error('Fehler beim Speichern des Profils:', error);
      setError('Beim Speichern des Profils ist ein Fehler aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Profil bearbeiten
      </Text>
      
      {/* Profilbild */}
      <View style={styles.avatarContainer}>
        <Button
          mode="text"
          onPress={handleChangeProfileImage}
          disabled={isUpdatingImage}
          loading={isUpdatingImage}
        >
          <View style={styles.avatarWrapper}>
            <ProfileAvatar
              imageUrl={photoURL}
              size={100}
              fallbackInitial={displayName || username}
            />
            <View style={[styles.editIconContainer, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.editIcon}>📷</Text>
            </View>
          </View>
        </Button>
      </View>
      
      {/* Formular */}
      <View style={styles.form}>
        <Input
          label="Name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Dein Name"
          containerStyle={styles.inputContainer}
        />
        
        <Input
          label="Benutzername"
          value={username}
          onChangeText={setUsername}
          placeholder="Dein Benutzername"
          containerStyle={styles.inputContainer}
        />
        
        <Input
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Erzähle etwas über dich"
          multiline
          numberOfLines={4}
          containerStyle={styles.inputContainer}
        />
        
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Links
        </Text>
        
        <Input
          label="Website"
          value={website}
          onChangeText={setWebsite}
          placeholder="https://deinewebsite.de"
          containerStyle={styles.inputContainer}
        />
        
        <Input
          label="Twitter"
          value={twitter}
          onChangeText={setTwitter}
          placeholder="@deintwitter"
          containerStyle={styles.inputContainer}
        />
        
        <Input
          label="GitHub"
          value={github}
          onChangeText={setGithub}
          placeholder="deingithub"
          containerStyle={styles.inputContainer}
        />
      </View>
      
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
      
      {/* Aktionsbuttons */}
      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.actionButton}
          disabled={isLoading}
        >
          Abbrechen
        </Button>
        
        <Button
          mode="contained"
          onPress={handleSaveProfile}
          style={styles.actionButton}
          loading={isLoading}
          disabled={isLoading}
        >
          Speichern
        </Button>
      </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 16,
    color: 'white',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 16,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default ProfileEditScreen;
