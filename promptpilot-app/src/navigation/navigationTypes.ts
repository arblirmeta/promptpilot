import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';

// Root Stack Parameter Liste
export type RootStackParamList = {
  Auth: undefined;
  ProfileSetup: undefined;
  Main: undefined;
  ProfileEdit: { profile: any };
  PromptDetail: { promptId: string };
  Followers: { userId: string };
  Following: { userId: string };
  CreatePrompt: undefined;
};

// Tab Parameter Liste
export type MainTabParamList = {
  MyPrompts: undefined;
  Home: undefined;
  CreatePrompt: undefined;
  Search: undefined;
  Profile: { userId?: string };
};

// Navigation Props für Stack-Navigation
export type RootStackNavigationProp<T extends keyof RootStackParamList> = 
  StackNavigationProp<RootStackParamList, T>;

// Navigation Props für Tab-Navigation
export type MainTabNavigationProp<T extends keyof MainTabParamList> = 
  BottomTabNavigationProp<MainTabParamList, T>;

// Kombinierte Navigation Props (für Screens innerhalb von Tabs)
export type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  StackNavigationProp<RootStackParamList>
>;

export type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

export type SearchScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Search'>,
  StackNavigationProp<RootStackParamList>
>;

export type MyPromptsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'MyPrompts'>,
  StackNavigationProp<RootStackParamList>
>;

// Route Props
export type ProfileScreenRouteProp = RouteProp<MainTabParamList, 'Profile'>;
export type ProfileEditScreenRouteProp = RouteProp<RootStackParamList, 'ProfileEdit'>;
export type PromptDetailScreenRouteProp = RouteProp<RootStackParamList, 'PromptDetail'>;
export type FollowersScreenRouteProp = RouteProp<RootStackParamList, 'Followers'>;
export type FollowingScreenRouteProp = RouteProp<RootStackParamList, 'Following'>;
