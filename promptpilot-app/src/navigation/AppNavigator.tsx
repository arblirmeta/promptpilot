import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { RootStackParamList, MainTabParamList } from './navigationTypes';
import type { ParamListBase } from '@react-navigation/native';

// Screens
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import PromptDetailScreen from '../screens/PromptDetailScreen';
import FollowersScreen from '../screens/FollowersScreen';
import FollowingScreen from '../screens/FollowingScreen';
import CreatePromptScreen from '../screens/CreatePromptScreen';
import MyPromptsScreen from '../screens/MyPromptsScreen';

// Icons
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Auth
import { useAuth } from '../services/AuthService';

// Navigation Types werden jetzt aus './navigationTypes' importiert

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Wrapper-Funktion, um TypeScript-Fehler bei den Navigation-Props zu vermeiden
type AnyNavComponentType = React.ComponentType<any>;
const withNavigationTypeFix = <P extends ParamListBase, S extends keyof P>(component: AnyNavComponentType) => {
  return component as React.ComponentType<any>;
};

// Main Tab Navigator
const MainTabNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.placeholder,
        tabBarStyle: {
          position: 'absolute',  // Absolute Position für bessere Platzierung
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          height: 100, // 100px hohe Tab-Bar
          bottom: 0, // Am unteren Rand fixiert
          paddingBottom: 20, // Mehr Abstand nach unten
          paddingTop: 15,
          // Stellen sicher, dass die Navigationsleiste nicht von Notches verdeckt wird
          paddingHorizontal: 10,
          // Schatteneffekt für bessere Tiefe
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          borderTopLeftRadius: 20,  // Abgerundete Ecken für einen modernen Look
          borderTopRightRadius: 20,
        },
        // Größerer Abstand zwischen den Icons und Labels
        tabBarItemStyle: {
          paddingVertical: 10,
          height: 80,  // Höhere Items für die größere Tab-Bar
        },
        // Größere Labels
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
          paddingBottom: 5,
        }
      }}
    >
      {/* 1. Meine Prompts */}
      <Tab.Screen 
        name="MyPrompts" 
        component={MyPromptsScreen} 
        options={{
          tabBarLabel: 'Meine Prompts',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document-multiple-outline" size={size} color={color} />
          ),
        }}
      />
      
      {/* 2. Home */}
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      
      {/* 3. Prompt erstellen (in der Mitte) */}
      <Tab.Screen 
        name="CreatePrompt" 
        component={CreatePromptScreen} 
        options={{
          tabBarLabel: 'Erstellen',
          tabBarIcon: ({ color }) => (
            <View style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: theme.colors.background,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: -15,
            }}>
              <MaterialCommunityIcons 
                name="plus-circle" 
                size={48} 
                color={theme.colors.primary} 
              />
            </View>
          ),
        }}
      />
      
      {/* 4. Suche */}
      <Tab.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{
          tabBarLabel: 'Suche',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="magnify" size={size} color={color} />
          ),
        }}
      />
      
      {/* 5. Profil */}
      <Tab.Screen 
        name="Profile" 
        component={withNavigationTypeFix(ProfileScreen)} 
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Root Navigator
const AppNavigator = () => {
  const { theme } = useTheme();
  const { user, hasProfile, loading } = useAuth();
  
  console.log('AppNavigator Status:', { user: !!user, hasProfile, loading });
  
  if (loading) {
    return null; // oder einen Ladebildschirm anzeigen
  }
  
  return (
    <NavigationContainer
      theme={{
        dark: theme.dark,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.notification,
        },
        // Füge Schriftarten für React Navigation hinzu
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: 'normal',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: 'bold',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '900',
          }
        }
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!user ? (
          // Nicht angemeldet -> Anmeldebildschirm
          <>
            <Stack.Screen 
              name="Auth" 
              component={AuthScreen} 
              options={{ headerShown: false }}
            />
          </>
        ) : !hasProfile ? (
          // Angemeldet aber ohne Profil -> Profil einrichten
          <>
            <Stack.Screen 
              name="ProfileSetup" 
              component={ProfileSetupScreen} 
              options={{ 
                title: 'Profil einrichten',
                headerShown: true,
                headerLeft: () => null // Zurück-Button deaktivieren
              }}
            />
          </>
        ) : (
          // Angemeldet mit Profil -> Hauptapp
          <>
            <Stack.Screen 
              name="Main" 
              component={MainTabNavigator} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ProfileEdit" 
              component={withNavigationTypeFix(ProfileEditScreen)} 
              options={{ title: 'Profil bearbeiten' }}
            />
            <Stack.Screen 
              name="PromptDetail" 
              component={withNavigationTypeFix(PromptDetailScreen)} 
              options={{ title: 'Prompt Details' }}
            />
            <Stack.Screen 
              name="Followers" 
              component={withNavigationTypeFix(FollowersScreen)} 
              options={{ title: 'Follower' }}
            />
            <Stack.Screen 
              name="Following" 
              component={withNavigationTypeFix(FollowingScreen)} 
              options={{ title: 'Folgt' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
