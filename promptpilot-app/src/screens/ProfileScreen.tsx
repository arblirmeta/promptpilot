import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import ProfileAvatar from '../components/ProfileAvatar';
import { auth } from '../config/firebase';
import UserProfileService from '../services/UserProfileService';
import { UserProfile } from '../models/UserProfile';
import * as ImagePicker from 'expo-image-picker';
import ImageService from '../services/ImageService';

interface ProfileScreenProps {
  route: {
    params?: {
      userId?: string;
    };
  };
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ route, navigation }) => {
  // Wenn keine userId angegeben ist, zeige das eigene Profil an
  const { userId = auth.currentUser?.uid } = route.params || {};
  const { theme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCurrentUserProfile, setIsCurrentUserProfile] = useState(false);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);
  const insets = { top: 60 }; // Berücksichtigung des Statusbars/SafeArea
  
  // Lade Profildaten
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Debug-Ausgaben für Benutzer-Status
        const currentUser = auth.currentUser;
        console.log('Aktueller Benutzer:', currentUser?.uid);
        console.log('Angefordertes Profil:', userId);
        
        setIsCurrentUserProfile(currentUser?.uid === userId);
        
        if (!userId && !currentUser) {
          console.error('Kein Benutzer angemeldet und keine userId angegeben');
          setError('Bitte melde dich an, um dein Profil zu sehen');
          setIsLoading(false);
          return;
        }
        
        // Verwende entweder die angegebene userId oder die des aktuellen Benutzers
        const profileId = userId || currentUser?.uid;
        console.log('Lade Profil für:', profileId);
        
        if (!profileId) {
          setError('Keine Benutzer-ID verfügbar');
          setIsLoading(false);
          return;
        }
        
        // Lade Profildaten
        const userProfile = await UserProfileService.getUserProfile(profileId);
        console.log('Geladenes Profil:', userProfile ? 'Gefunden' : 'Nicht gefunden');
        
        if (userProfile) {
          setProfile(userProfile);
          
          // Prüfe, ob der aktuelle Benutzer diesem Benutzer folgt
          if (currentUser && currentUser.uid !== profileId) {
            const following = await UserProfileService.isFollowing(currentUser.uid, profileId);
            setIsFollowing(following);
          }
        } else {
          console.error('Profil nicht gefunden für ID:', profileId);
          setError('Profil nicht gefunden');
        }
      } catch (error) {
        console.error('Fehler beim Laden des Profils:', error);
        setError(`Beim Laden des Profils ist ein Fehler aufgetreten: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfileData();
  }, [userId]);
  
  // Folgen/Entfolgen-Funktion
  const handleFollowToggle = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !profile) return;
      
      if (isFollowing) {
        await UserProfileService.unfollowUser(currentUser.uid, profile.userId);
        setIsFollowing(false);
      } else {
        await UserProfileService.followUser(currentUser.uid, profile.userId);
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
  
  // Profilbild ändern
  const handleChangeProfileImage = async () => {
    try {
      // Berechtigungen anfordern
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Berechtigung erforderlich',
          'Wir benötigen die Berechtigung, auf deine Fotos zuzugreifen',
          [{ text: 'OK' }]
        );
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
        
        // Profil aktualisieren
        await UserProfileService.updateUserProfile(currentUser.uid, {
          photoURL: downloadURL
        });
        
        // Profil neu laden
        const updatedProfile = await UserProfileService.getUserProfile(currentUser.uid);
        setProfile(updatedProfile);
        
        Alert.alert(
          'Erfolg',
          'Dein Profilbild wurde aktualisiert',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Fehler beim Ändern des Profilbilds:', error);
      Alert.alert(
        'Fehler',
        'Beim Ändern des Profilbilds ist ein Fehler aufgetreten',
        [{ text: 'OK' }]
      );
    } finally {
      setIsUpdatingImage(false);
    }
  };
  
  // Zur Profilbearbeitung navigieren
  const handleEditProfile = () => {
    navigation.navigate('ProfileEdit', { profile });
  };
  
  // Follower anzeigen
  const handleShowFollowers = () => {
    navigation.navigate('Followers', { userId: profile?.userId });
  };
  
  // Folgende anzeigen
  const handleShowFollowing = () => {
    navigation.navigate('Following', { userId: profile?.userId });
  };
  
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  if (error || !profile) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Fehler-Anzeige, wenn ein Fehler aufgetreten ist */}
        {error && (
          <View style={{ padding: 16, backgroundColor: theme.colors.error + '20', borderRadius: 8, marginBottom: 16 }}>
            <Text style={{ color: theme.colors.error, fontWeight: 'bold' }}>{error}</Text>
          </View>
        )}
        
        {/* Debug-Info für Entwicklung */}
        <View style={{ marginBottom: 16, padding: 8, backgroundColor: theme.colors.backdrop, borderRadius: 4 }}>
          <Text style={{ fontSize: 12, color: theme.colors.subtext }}>
            UID: {userId || 'Keine'} | Auth: {auth.currentUser?.uid || 'Nicht angemeldet'}
          </Text>
        </View>
        
        <Text style={{ color: theme.colors.error }}>{error || 'Profil nicht gefunden'}</Text>
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
      contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top }]}
      testID="profile-screen-scrollview"
    >
      {/* Profilheader mit angepasstem Abstand */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            disabled={!isCurrentUserProfile || isUpdatingImage}
            onPress={handleChangeProfileImage}
            activeOpacity={isCurrentUserProfile ? 0.7 : 1}
          >
            {isUpdatingImage ? (
              <View style={[styles.avatarLoader, { backgroundColor: theme.colors.backdrop }]}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : (
              <ProfileAvatar
                imageUrl={profile.photoURL}
                size={100}
                fallbackInitial={profile.displayName || profile.username}
              />
            )}
            
            {isCurrentUserProfile && (
              <View style={[styles.editIconContainer, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.editIcon}>📷</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={[styles.displayName, { color: theme.colors.text }]}>
            {profile.displayName || 'Kein Name'}
          </Text>
          
          {profile.username && (
            <Text style={[styles.username, { color: theme.colors.subtext }]}>
              @{profile.username}
            </Text>
          )}
          
          {profile.bio && (
            <Text style={[styles.bio, { color: theme.colors.text }]}>
              {profile.bio}
            </Text>
          )}
          
          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.stat} onPress={handleShowFollowers}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {profile.followersCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.subtext }]}>
                Follower
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.stat} onPress={handleShowFollowing}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {profile.followingCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.subtext }]}>
                Folgt
              </Text>
            </TouchableOpacity>
            
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {profile.promptsCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.subtext }]}>
                Prompts
              </Text>
            </View>
          </View>
          
          {/* Aktionsbuttons */}
          <View style={styles.actionContainer}>
            {isCurrentUserProfile ? (
              <Button
                mode="outlined"
                onPress={handleEditProfile}
                style={styles.actionButton}
              >
                Profil bearbeiten
              </Button>
            ) : (
              <Button
                mode={isFollowing ? "outlined" : "contained"}
                onPress={handleFollowToggle}
                style={styles.actionButton}
              >
                {isFollowing ? 'Entfolgen' : 'Folgen'}
              </Button>
            )}
          </View>
        </View>
      </View>
      
      <Divider style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
      
      {/* Links */}
      {profile.links && Object.values(profile.links).some(link => !!link) && (
        <View style={styles.linksContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Links
          </Text>
          
          {profile.links.website && (
            <View style={styles.linkItem}>
              <Text style={styles.linkIcon}>🌐</Text>
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                {profile.links.website}
              </Text>
            </View>
          )}
          
          {profile.links.twitter && (
            <View style={styles.linkItem}>
              <Text style={styles.linkIcon}>🐦</Text>
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                {profile.links.twitter}
              </Text>
            </View>
          )}
          
          {profile.links.github && (
            <View style={styles.linkItem}>
              <Text style={styles.linkIcon}>💻</Text>
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                {profile.links.github}
              </Text>
            </View>
          )}
        </View>
      )}
      
      {/* Hier könnten die Prompts des Benutzers angezeigt werden */}
      <View style={styles.promptsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Prompts
        </Text>
        
        {/* Hier würde eine Liste von Prompts angezeigt werden */}
        <Text style={[styles.emptyText, { color: theme.colors.subtext }]}>
          Keine Prompts gefunden
        </Text>
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
  header: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
    // Füge Tiefe durch Schatten hinzu
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarContainer: {
    marginRight: 16,
    position: 'relative',
  },
  avatarLoader: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
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
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stat: {
    marginRight: 24,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
  },
  actionContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
  },
  divider: {
    marginVertical: 16,
  },
  linksContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  linkText: {
    fontSize: 16,
  },
  promptsContainer: {
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default ProfileScreen;
