import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Text } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import ImageService from '../services/ImageService';
import AsyncImageCache from '../utils/AsyncImageCache';

interface ProfileAvatarProps {
  imageUrl?: string;
  size?: number;
  fallbackInitial?: string;
  backgroundColor?: string;
  onPress?: () => void;
  showBorder?: boolean;
  borderColor?: string;
  borderWidth?: number;
  elevation?: number;
  badge?: React.ReactNode;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  imageUrl,
  size = 40,
  fallbackInitial,
  backgroundColor,
  onPress,
  showBorder = false,
  borderColor,
  borderWidth = 2,
  elevation,
  badge,
}) => {
  // Hole den Theme-Context, wobei theme das tatsächliche Themen-Objekt ist
  const themeContext = useTheme();
  // Stelle sicher, dass theme und theme.colors existieren, mit Fallback-Werten
  const theme = themeContext?.theme || { 
    colors: {
      primary: '#3498db',
      background: '#ffffff',
      text: '#000000',
      error: '#e74c3c'
    }
  };
  const [displayUrl, setDisplayUrl] = React.useState<string | undefined>(imageUrl);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [hasError, setHasError] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (imageUrl) {
      refreshImageUrl();
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  }, [imageUrl]);

  const refreshImageUrl = async () => {
    setIsLoading(true);
    setHasError(false);

    if (!imageUrl) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    try {
      // 1. Prüfe zuerst den AsyncImageCache
      const cachedImage = await AsyncImageCache.getCachedImage(imageUrl);
      if (cachedImage) {
        setDisplayUrl(cachedImage);
        setIsLoading(false);
        return;
      }

      // 2. Direkter HTTPS-Link (UI Avatars oder ähnliche externe Dienste)
      if (imageUrl.startsWith('https://')) {
        if (imageUrl.includes('ui-avatars.com') || !imageUrl.includes('firebasestorage')) {
          setDisplayUrl(imageUrl);
          setIsLoading(false);
          return;
        }
      }

      // 3. Versuche, über den ImageService das Bild zu laden
      if (imageUrl) {
        const storagePath = ImageService.extractStoragePath(imageUrl);
        if (storagePath) {
          try {
            console.log('Versuche, Bild über ImageService zu laden:', storagePath);
            const refreshedUrl = await ImageService.getRefreshedImageUrl(storagePath);
            if (refreshedUrl) {
              console.log('Bild über ImageService geladen:', refreshedUrl);
              // Speichere im AsyncImageCache für zukünftige Verwendung
              await AsyncImageCache.cacheImage(imageUrl, refreshedUrl);
              setDisplayUrl(refreshedUrl);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.log('ImageService Fehler:', e);
          }
        }
      }

      // Wenn wir hier ankommen, ist etwas schiefgelaufen
      console.log('Konnte kein Profilbild laden, verwende Fallback');
      setIsLoading(false);
      setHasError(true);
    } catch (e) {
      console.log('Unerwarteter Fehler beim Laden des Profilbilds:', e);
      setIsLoading(false);
      setHasError(true);
    }
  };

  // Stelle sicher, dass wir Fallback-Werte haben
  const defaultPrimary = '#3498db';
  const bgColor = backgroundColor || (theme.colors?.primary || defaultPrimary);
  const border = borderColor || (theme.colors?.primary || defaultPrimary);

  const buildFallbackContent = () => {
    if (fallbackInitial && fallbackInitial.length > 0) {
      // Extrahiere den ersten Buchstaben oder zwei Initialen, wenn ein Leerzeichen vorhanden ist
      let initials;
      if (fallbackInitial.includes(' ')) {
        const nameParts = fallbackInitial.split(' ');
        if (nameParts.length >= 2 && nameParts[0].length > 0 && nameParts[1].length > 0) {
          initials = nameParts[0][0] + nameParts[1][0];
        } else {
          initials = nameParts[0][0];
        }
      } else {
        initials = fallbackInitial[0];
      }

      return (
        <Text
          style={{
            color: 'white',
            fontWeight: 'bold',
            fontSize: size * (initials.length > 1 ? 0.35 : 0.45),
            letterSpacing: -0.5,
          }}
        >
          {initials.toUpperCase()}
        </Text>
      );
    } else {
      return (
        <Text
          style={{
            color: 'white',
            fontSize: size * 0.5,
          }}
        >
          👤
        </Text>
      );
    }
  };

  const hasValidUrl = !hasError && 
    displayUrl && 
    displayUrl.startsWith('http') &&
    !displayUrl.includes('null');

  // Basis-Avatar-Widget erstellen
  let avatarContent;
  
  if (isLoading) {
    // Ladeanzeige
    avatarContent = (
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bgColor + '4D', // 30% Transparenz
          },
        ]}
      >
        <ActivityIndicator
          size={size * 0.4}
          color="white"
        />
      </View>
    );
  } else {
    // Fertiger Avatar mit Bild oder Fallback
    avatarContent = (
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bgColor,
          },
        ]}
      >
        {hasValidUrl ? (
          <Image
            source={{ uri: displayUrl }}
            style={[
              styles.image,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
            contentFit="cover"
            transition={300}
            onError={() => setHasError(true)}
          />
        ) : (
          buildFallbackContent()
        )}
      </View>
    );
  }

  // Container mit Border und Elevation erstellen, wenn gewünscht
  let avatar = avatarContent;
  
  if (showBorder || elevation) {
    avatar = (
      <View
        style={[
          {
            borderRadius: size / 2,
            borderWidth: showBorder ? borderWidth : 0,
            borderColor: border,
            elevation: elevation,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: elevation ? elevation / 2 : 0 },
            shadowOpacity: elevation ? 0.2 : 0,
            shadowRadius: elevation,
          },
        ]}
      >
        {avatarContent}
      </View>
    );
  }

  // Badge hinzufügen, falls vorhanden
  if (badge) {
    avatar = (
      <View style={{ position: 'relative' }}>
        {avatar}
        <View
          style={{
            position: 'absolute',
            right: -size * 0.1,
            bottom: -size * 0.05,
          }}
        >
          {badge}
        </View>
      </View>
    );
  }

  // GestureDetector für Tap-Interaktionen
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {avatar}
      </TouchableOpacity>
    );
  }

  return avatar;
};

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    backgroundColor: 'transparent',
  },
});

export default ProfileAvatar;
