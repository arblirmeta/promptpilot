import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, TextInput, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '../theme/ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from '../config/firebase';

type AuthScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Auth'>;
};

const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Zurücksetzen der Fehler beim Ändern von Eingabefeldern
  const resetErrors = () => {
    setEmailError('');
    setPasswordError('');
  };

  // Validieren des E-Mail-Formats
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validieren des Passworts
  const isValidPassword = (password: string): boolean => {
    return password.length >= 6; // Firebase erfordert mindestens 6 Zeichen
  };

  // Validieren der Eingabefelder
  const validateInputs = (): boolean => {
    resetErrors();
    let isValid = true;

    if (!email || !isValidEmail(email)) {
      setEmailError('Bitte gib eine gültige E-Mail-Adresse ein');
      isValid = false;
    }

    if (!password || !isValidPassword(password)) {
      setPasswordError('Das Passwort muss mindestens 6 Zeichen lang sein');
      isValid = false;
    }

    if (isRegisterMode && password !== confirmPassword) {
      setPasswordError('Die Passwörter stimmen nicht überein');
      isValid = false;
    }

    return isValid;
  };

  // Login-Funktion
  const handleLogin = async () => {
    if (!validateInputs()) return;

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      // Die Navigation wird durch den AuthService und den AppNavigator automatisch gehandhabt
    } catch (error: any) {
      console.error('Fehler beim Login:', error);
      const errorMessage = getAuthErrorMessage(error.code);
      Alert.alert('Login fehlgeschlagen', errorMessage);
      setLoading(false);
    }
  };

  // Registrierungs-Funktion
  const handleRegister = async () => {
    if (!validateInputs()) return;

    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      // Die Navigation wird durch den AuthService und den AppNavigator automatisch gehandhabt
    } catch (error: any) {
      console.error('Fehler bei der Registrierung:', error);
      const errorMessage = getAuthErrorMessage(error.code);
      Alert.alert('Registrierung fehlgeschlagen', errorMessage);
      setLoading(false);
    }
  };

  // Passwort zurücksetzen
  const handleForgotPassword = async () => {
    if (!email || !isValidEmail(email)) {
      setEmailError('Bitte gib eine gültige E-Mail-Adresse ein');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Passwort zurücksetzen', 
        'Eine E-Mail zum Zurücksetzen des Passworts wurde gesendet. Bitte überprüfe deinen Posteingang.'
      );
    } catch (error: any) {
      console.error('Fehler beim Zurücksetzen des Passworts:', error);
      const errorMessage = getAuthErrorMessage(error.code);
      Alert.alert('Fehler', errorMessage);
    }
  };

  // Fehlermeldungen für Firebase Auth-Fehler
  const getAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Es existiert kein Nutzer mit dieser E-Mail-Adresse.';
      case 'auth/wrong-password':
        return 'Falsches Passwort.';
      case 'auth/email-already-in-use':
        return 'Diese E-Mail-Adresse wird bereits verwendet.';
      case 'auth/invalid-email':
        return 'Ungültige E-Mail-Adresse.';
      case 'auth/weak-password':
        return 'Das Passwort ist zu schwach. Es sollte mindestens 6 Zeichen lang sein.';
      case 'auth/too-many-requests':
        return 'Zu viele Anfragen. Bitte versuche es später erneut.';
      default:
        return 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.';
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={styles.logoContainer}>
            <Text style={[styles.logo, { color: theme.colors.primary }]}>PromptPilot</Text>
          </View>
          
          <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {isRegisterMode ? 'Registrieren' : 'Anmelden'}
            </Text>
            
            <TextInput
              label="E-Mail"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                resetErrors();
              }}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!emailError}
              disabled={loading}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            
            <TextInput
              label="Passwort"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                resetErrors();
              }}
              mode="outlined"
              style={styles.input}
              secureTextEntry
              error={!!passwordError}
              disabled={loading}
            />
            
            {isRegisterMode && (
              <TextInput
                label="Passwort bestätigen"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  resetErrors();
                }}
                mode="outlined"
                style={styles.input}
                secureTextEntry
                error={!!passwordError}
                disabled={loading}
              />
            )}
            
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            
            {!isRegisterMode && (
              <TouchableOpacity 
                onPress={handleForgotPassword} 
                style={styles.forgotPasswordContainer}
                disabled={loading}
              >
                <Text style={[styles.forgotPassword, { color: theme.colors.primary }]}>
                  Passwort vergessen?
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.buttonContainer}>
            {loading ? (
              <ActivityIndicator animating={true} color={theme.colors.primary} size="large" />
            ) : (
              <>
                <Button
                  mode="contained"
                  onPress={isRegisterMode ? handleRegister : handleLogin}
                  style={[styles.button, { backgroundColor: theme.colors.primary }]}
                  labelStyle={{ color: 'white' }}
                >
                  {isRegisterMode ? 'Registrieren' : 'Anmelden'}
                </Button>
                
                <TouchableOpacity 
                  onPress={() => setIsRegisterMode(!isRegisterMode)}
                  style={styles.switchModeContainer}
                >
                  <Text style={{ color: theme.colors.primary }}>
                    {isRegisterMode ? 'Bereits ein Konto? Anmelden' : 'Noch kein Konto? Registrieren'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  contentContainer: {
    width: '100%',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
    lineHeight: 24,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  forgotPasswordContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginTop: 5,
    marginBottom: 10,
  },
  forgotPassword: {
    fontSize: 14,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  button: {
    width: '100%',
    padding: 5,
    borderRadius: 10,
  },
  switchModeContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});

export default AuthScreen;
