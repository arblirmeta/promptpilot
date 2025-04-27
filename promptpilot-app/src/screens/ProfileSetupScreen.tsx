import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Text, Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeContext';
import ProfileAvatar from '../components/ProfileAvatar';
import UserProfileService from '../services/UserProfileService';
import ImageService from '../services/ImageService';
import { auth } from '../config/firebase';
import { useAuth } from '../services/AuthService';

interface ProfileSetupScreenProps {
  navigation: any;
}

const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth(); // Import Auth-Hook, um den Status zu aktualisieren
  const colors = theme.colors;
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleChangeProfilePicture = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Fehler', 'Du musst angemeldet sein, um ein Profilbild hochzuladen');
        return;
      }
      
      // Berechtigungen für die Fotogalerie anfordern
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Berechtigung erforderlich', 'Du musst den Zugriff auf deine Fotogalerie erlauben, um ein Profilbild auswählen zu können.');
        return;
      }
      
      // Bilder aus der Galerie auswählen
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // Bild hochladen mit ImageService
        const downloadUrl = await ImageService.uploadProfileImage(currentUser.uid, selectedImage.uri);
      
        if (downloadUrl) {
          setImageUrl(downloadUrl);
          Alert.alert('Erfolg', 'Profilbild wurde erfolgreich hochgeladen');
        }
      }
    } catch (e) {
      console.error('Fehler beim Hochladen des Profilbilds:', e);
      Alert.alert('Fehler', `Fehler beim Hochladen des Profilbilds: ${e}`);
    }
  };
  
  const handleNameChange = (text: string) => {
    setName(text);
  };
  
  const handleContinue = async () => {
    if (name.trim() === '') {
      Alert.alert('Fehler', 'Bitte gib einen Namen ein');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Fehler', 'Du musst angemeldet sein, um dein Profil zu erstellen');
        return;
      }
      
      // UserProfileService.updateUserProfile aufrufen
      // Mit korrekter Typisierung für das Profil-Objekt
      // Aktualisiere das Benutzerprofil mit den neuen Daten
      await UserProfileService.updateUserProfile(
        currentUser.uid,
        {
          displayName: name.trim(),  // In UserProfile ist es 'displayName' statt 'name'
          photoURL: imageUrl,        // In UserProfile ist es 'photoURL' statt 'imageUrl'
          email: currentUser.email || '',
          // Füge weitere grundlegende Profilinformationen hinzu
          bio: '',
          joinDate: new Date(),
          links: {
            website: '',
            twitter: '',
            github: ''
          }
        }
      );
      
      // Debug-Log
      console.log('Profil erfolgreich erstellt für:', currentUser.uid);
      
      // Trigger eine Aktualisierung der auth-Abfrage
      // Wir navigieren zur HomeScreen 
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }]
      });
    } catch (e) {
      console.error('Fehler beim Erstellen des Profils:', e);
      Alert.alert('Fehler', `Fehler beim Erstellen des Profils: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Profil einrichten</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Erstelle dein Profil, um mit der Community zu interagieren
        </Text>
        
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handleChangeProfilePicture}>
            <ProfileAvatar
              imageUrl={imageUrl}
              size={120}
              fallbackInitial={name.charAt(0)}
              showBorder
              borderColor={colors.primary}
              elevation={4}
            />
            <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.editBadgeText}>Foto hinzufügen</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Dein Name</Text>
          <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              value={name}
              onChangeText={handleNameChange}
              placeholder="Name eingeben"
              placeholderTextColor={colors.placeholder}
              style={[styles.inputText, { color: colors.text }]}
            />
          </View>
        </View>
        
        <Button
          mode="contained"
          onPress={handleContinue}
          loading={isLoading}
          style={styles.continueButton}
          disabled={name.trim() === ''}
        >
          Fortfahren
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.8,
  },
  avatarContainer: {
    marginBottom: 32,
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: -10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  editBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 16,
  },
  continueButton: {
    width: '100%',
    paddingVertical: 8,
    marginTop: 16,
  },
});

export default ProfileSetupScreen;
