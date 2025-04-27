import { useState, useEffect } from 'react';
import { 
  signInAnonymously, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut
} from 'firebase/auth';
import { auth } from '../config/firebase';
import UserProfileService from './UserProfileService';

interface AuthState {
  user: FirebaseUser | null;
  hasProfile: boolean;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    hasProfile: false,
    loading: true,
    error: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (user) {
          try {
            // Prüfen, ob der Benutzer bereits ein Profil hat
            console.log('Prüfe, ob Benutzer ein Profil hat:', user.uid);
            const userProfile = await UserProfileService.getUserProfile(user.uid);
            
            setAuthState({
              user,
              hasProfile: userProfile !== null,
              loading: false,
              error: null
            });
            console.log('Profil gefunden:', userProfile !== null);
          } catch (error) {
            console.error('Fehler beim Prüfen des Benutzerprofils:', error);
            setAuthState({
              user,
              hasProfile: false,
              loading: false,
              error: null
            });
          }
        } else {
          setAuthState({
            user: null,
            hasProfile: false,
            loading: false,
            error: null
          });
        }
      },
      (error) => {
        setAuthState({
          user: null,
          hasProfile: false,
          loading: false,
          error: error.message
        });
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const signInAnonymouslyAsync = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await signInAnonymously(auth);
      // Auth state will be updated by the onAuthStateChanged listener
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }));
    }
  };

  const signOutAsync = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await signOut(auth);
      // Auth state will be updated by the onAuthStateChanged listener
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }));
    }
  };

  return {
    user: authState.user,
    hasProfile: authState.hasProfile,
    loading: authState.loading,
    error: authState.error,
    signInAnonymously: signInAnonymouslyAsync,
    signOut: signOutAsync
  };
};
