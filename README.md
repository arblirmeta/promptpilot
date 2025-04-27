# PromptPilot

PromptPilot ist eine mobile App, die es Nutzern ermöglicht, KI-Prompts zu teilen, zu bewerten und zu entdecken. Die Plattform hilft Benutzern dabei, effektivere Prompts zu erstellen und von der Community zu lernen.

## Features

- **Benutzerauthentifizierung**: Registrierung und Login mit E-Mail oder Google
- **Profilverwaltung**: Personalisierte Benutzerprofile mit Profilbildern
- **Prompt-Sharing**: Veröffentlichen und Teilen von KI-Prompts
- **Bewertungen und Kommentare**: Bewerten und Kommentieren von Prompts
- **Folge-System**: Folge deinen Lieblingsautoren
- **Dunkelmodus**: Unterstützung für helles und dunkles Design

## Tech Stack

- **Framework**: React Native mit Expo
- **Sprache**: TypeScript
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **UI-Komponenten**: Custom Components mit flexiblem Theming
- **Navigation**: React Navigation

## Installation

1. Stelle sicher, dass Node.js und npm installiert sind.
2. Installiere Expo CLI:
   ```
   npm install -g expo-cli
   ```
3. Klone das Repository:
   ```
   git clone https://github.com/arblirmeta/promptpilot.git
   cd promptpilot-app
   ```
4. Installiere die Abhängigkeiten:
   ```
   npm install
   ```
5. Starte die App:
   ```
   npx expo start
   ```

## Projektstruktur

```
promptpilot-app/
├── assets/              # Bilder und Ressourcen
├── src/
│   ├── components/      # Wiederverwendbare UI-Komponenten
│   ├── config/          # Konfigurationsdateien (Firebase, etc.)
│   ├── models/          # Datenmodelle
│   ├── navigation/      # Navigation und Routing
│   ├── screens/         # App-Screens
│   ├── services/        # Dienste für API-Aufrufe und Datenverarbeitung
│   ├── theme/           # Styling und Theming
│   └── utils/           # Hilfstools und Dienstprogramme
└── App.tsx              # Haupteinstiegspunkt der App
```

## Hinweise zur Entwicklung

- Profilbilder werden in Firebase Storage unter dem Pfad 'profile_images' gespeichert
- Die App unterstützt sowohl helles als auch dunkles Design durch das ThemeContext
- Authentifizierung erfolgt über Firebase Auth mit E-Mail/Passwort sowie Google-Anmeldung

## Lizenz

MIT
