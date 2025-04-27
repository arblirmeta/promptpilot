import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import UserProfileService from '../services/UserProfileService';
import { UserProfile } from '../models/UserProfile';
import ProfileListItem from '../components/ProfileListItem';

interface FollowersScreenProps {
  route: {
    params: {
      userId: string;
    };
  };
  navigation: any;
}

const FollowersScreen: React.FC<FollowersScreenProps> = ({ route, navigation }) => {
  const { userId } = route.params;
  const { theme } = useTheme();
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Lade Follower
  useEffect(() => {
    const loadFollowers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const userFollowers = await UserProfileService.getUserFollowers(userId);
        setFollowers(userFollowers);
      } catch (error) {
        console.error('Fehler beim Laden der Follower:', error);
        setError('Beim Laden der Follower ist ein Fehler aufgetreten');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFollowers();
  }, [userId]);
  
  // Zum Profil navigieren
  const handleProfilePress = (profile: UserProfile) => {
    navigation.navigate('Profile', { userId: profile.userId });
  };
  
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.error }}>{error}</Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={followers}
        keyExtractor={(item) => item.userId}
        renderItem={({ item }) => (
          <ProfileListItem
            profile={item}
            onPress={() => handleProfilePress(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.subtext }]}>
              Keine Follower gefunden
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default FollowersScreen;
