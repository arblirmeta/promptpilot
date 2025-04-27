const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Beschränke die Überwachung auf das App-Verzeichnis
config.watchFolders = [__dirname];

// Füge explizit zu ignorierende Pfade hinzu
config.resolver.blacklistRE = [
  /..\/node_modules\/.*/,  // Ignoriere node_modules im übergeordneten Verzeichnis
];

// Exportiere die Konfiguration
module.exports = config;
