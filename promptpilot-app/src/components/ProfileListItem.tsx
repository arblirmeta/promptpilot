import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import ProfileAvatar from './ProfileAvatar';
import { UserProfile } from '../models/UserProfile';

interface ProfileListItemProps {
  profile: UserProfile;
  onPress: () => void;
  showFollowButton?: boolean;
  isFollowing?: boolean;
  onFollowPress?: () => void;
}

const ProfileListItem: React.FC<ProfileListItemProps> = ({
  profile,
  onPress,
  showFollowButton = false,
  isFollowing = false,
  onFollowPress
}) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.divider
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <ProfileAvatar
        imageUrl={profile.photoURL}
        size={50}
        fallbackInitial={profile.displayName || profile.username}
      />
      
      <View style={styles.infoContainer}>
        <Text style={[styles.displayName, { color: theme.colors.text }]}>
          {profile.displayName || 'Kein Name'}
        </Text>
        
        {profile.username && (
          <Text style={[styles.username, { color: theme.colors.subtext }]}>
            @{profile.username}
          </Text>
        )}
        
        {profile.bio && (
          <Text 
            style={[styles.bio, { color: theme.colors.text }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {profile.bio}
          </Text>
        )}
      </View>
      
      {showFollowButton && onFollowPress && (
        <TouchableOpacity
          style={[
            styles.followButton,
            { 
              backgroundColor: isFollowing ? 'transparent' : theme.colors.primary,
              borderColor: theme.colors.primary,
              borderWidth: isFollowing ? 1 : 0
            }
          ]}
          onPress={onFollowPress}
        >
          <Text style={[
            styles.followButtonText,
            { color: isFollowing ? theme.colors.primary : 'white' }
          ]}>
            {isFollowing ? 'Entfolgen' : 'Folgen'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  displayName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 14,
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    marginTop: 4,
  },
  followButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ProfileListItem;
