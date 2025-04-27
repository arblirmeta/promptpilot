import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'image_cache_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 Stunden in Millisekunden

/**
 * Cache-System für Bilder mit AsyncStorage statt localStorage
 */
class AsyncImageCache {
  /**
   * Speichert eine Bild-URL im Cache
   */
  async cacheImage(imageUrl: string, base64Image: string): Promise<void> {
    try {
      if (!imageUrl || !base64Image) return;
      
      const now = new Date().getTime();
      const cacheItem = {
        data: base64Image,
        timestamp: now
      };
      
      await AsyncStorage.setItem(
        `${CACHE_PREFIX}${imageUrl}`, 
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.warn('Fehler beim Speichern des Bildes im Cache:', error);
    }
  }

  /**
   * Lädt ein Bild aus dem Cache
   */
  async getCachedImage(imageUrl: string): Promise<string | null> {
    try {
      if (!imageUrl) return null;
      
      const cacheData = await AsyncStorage.getItem(`${CACHE_PREFIX}${imageUrl}`);
      if (!cacheData) return null;
      
      const cacheItem = JSON.parse(cacheData);
      const now = new Date().getTime();
      
      // Prüfe, ob der Cache-Eintrag abgelaufen ist
      if (now - cacheItem.timestamp > CACHE_EXPIRY) {
        await AsyncStorage.removeItem(`${CACHE_PREFIX}${imageUrl}`);
        return null;
      }
      
      return cacheItem.data;
    } catch (error) {
      console.warn('Fehler beim Abrufen des Cache-Bildes:', error);
      return null;
    }
  }

  /**
   * Löscht abgelaufene Cache-Einträge
   */
  async clearExpiredCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const imageKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      const now = new Date().getTime();

      for (const key of imageKeys) {
        const cacheData = await AsyncStorage.getItem(key);
        if (cacheData) {
          const cacheItem = JSON.parse(cacheData);
          if (now - cacheItem.timestamp > CACHE_EXPIRY) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('Fehler beim Löschen des abgelaufenen Cache:', error);
    }
  }
}

// Singleton-Instanz exportieren
const asyncImageCache = new AsyncImageCache();
export default asyncImageCache;
