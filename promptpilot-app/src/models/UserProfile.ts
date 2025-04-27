export interface UserProfile {
  userId: string;
  displayName?: string;
  username?: string;
  email?: string;
  photoURL?: string;
  bio?: string;
  joinDate?: Date | string;
  links?: {
    twitter?: string;
    website?: string;
    github?: string;
  };
  followersCount?: number;
  followingCount?: number;
  promptsCount?: number;
}
