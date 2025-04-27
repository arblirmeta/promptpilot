import { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

// Cache für Bild-URLs
interface ImageCache {
  [key: string]: {
    url: string;
    timestamp: number;
    expiry: number;
  };
}

class ImageService {
  private cache: ImageCache = {};
  private readonly CACHE_EXPIRY_MS = 1000 * 60 * 60; // 1 Stunde

  constructor() {
    // Lade Cache aus dem lokalen Speicher, falls vorhanden
    this.loadCacheFromStorage();
    
    // Regelmäßige Cache-Bereinigung
    setInterval(() => this.cleanupCache(), 1000 * 60 * 15); // Alle 15 Minuten
  }

  // Cache in den lokalen Speicher speichern
  private saveCacheToStorage(): void {
    try {
      localStorage.setItem('imageCache', JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Fehler beim Speichern des Image-Caches:', error);
    }
  }

  // Cache aus dem lokalen Speicher laden
  private loadCacheFromStorage(): void {
    try {
      const cachedData = localStorage.getItem('imageCache');
      if (cachedData) {
        this.cache = JSON.parse(cachedData);
        this.cleanupCache(); // Bereinige abgelaufene Einträge
      }
    } catch (error) {
      console.warn('Fehler beim Laden des Image-Caches:', error);
      this.cache = {};
    }
  }

  // Abgelaufene Cache-Einträge bereinigen
  private cleanupCache(): void {
    const now = Date.now();
    let hasChanges = false;
    
    Object.keys(this.cache).forEach(key => {
      if (now > this.cache[key].expiry) {
        delete this.cache[key];
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      this.saveCacheToStorage();
    }
  }

  // Bild-URL zum Cache hinzufügen
  private addToCache(path: string, url: string): void {
    const now = Date.now();
    this.cache[path] = {
      url,
      timestamp: now,
      expiry: now + this.CACHE_EXPIRY_MS
    };
    
    this.saveCacheToStorage();
  }

  // Bild hochladen und URL zurückgeben
  async uploadImage(uri: string, path: string): Promise<string> {
    try {
      // Konvertiere das Bild in ein Blob-Format
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Erstelle eine Referenz zum Speicherort
      const storageRef = ref(storage, path);
      
      // Lade das Bild hoch
      await uploadBytes(storageRef, blob);
      
      // Hole die Download-URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Füge die URL zum Cache hinzu
      this.addToCache(path, downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('Fehler beim Hochladen des Bildes:', error);
      throw error;
    }
  }

  // Bild-URL abrufen (mit Cache)
  async getImageUrl(path: string): Promise<string> {
    try {
      // Prüfe, ob die URL im Cache ist und nicht abgelaufen ist
      if (this.cache[path] && Date.now() < this.cache[path].expiry) {
        return this.cache[path].url;
      }
      
      // Prüfe verschiedene mögliche Pfade
      const possiblePaths = [path];
      
      // Wenn der Pfad mit profile_pics/ beginnt, füge auch profile_images/ hinzu
      if (path.startsWith('profile_pics/')) {
        const alternativePath = path.replace('profile_pics/', 'profile_images/');
        possiblePaths.unshift(alternativePath); // Priorität für profile_images
      }
      
      // Versuche, die URL für jeden möglichen Pfad zu erhalten
      for (const currentPath of possiblePaths) {
        try {
          const storageRef = ref(storage, currentPath);
          const url = await getDownloadURL(storageRef);
          
          // Füge die URL zum Cache hinzu
          this.addToCache(path, url);
          
          return url;
        } catch (error) {
          // Ignoriere Fehler und versuche den nächsten Pfad
          console.warn(`Bild nicht gefunden unter ${currentPath}, versuche alternative Pfade...`);
        }
      }
      
      throw new Error(`Bild nicht gefunden unter ${path}`);
    } catch (error) {
      console.error('Fehler beim Abrufen der Bild-URL:', error);
      throw error;
    }
  }

  // Profilbild hochladen
  async uploadProfileImage(userId: string, uri: string): Promise<string> {
    const filename = `${Date.now()}.jpg`;
    const path = `profile_images/${userId}/${filename}`;
    return this.uploadImage(uri, path);
  }

  // Extrahiere den Speicherpfad aus einer Firebase Storage URL
  extractStoragePath(url: string): string | null {
    if (!url) return null;

    // Versuche, den Pfad aus einer Firebase Storage URL zu extrahieren
    try {
      // URLs haben typischerweise das Format:
      // https://firebasestorage.googleapis.com/v0/b/BUCKET_NAME/o/PATH?token=TOKEN
      if (url.includes('firebasestorage.googleapis.com')) {
        const match = url.match(/\/o\/([^?]+)/);
        if (match && match[1]) {
          // Decodiere den URL-encodierten Pfad
          return decodeURIComponent(match[1]);
        }
      }

      // Wenn es eine gs:// URL ist
      if (url.startsWith('gs://')) {
        const parts = url.split('/');
        if (parts.length >= 4) {
          // Alles nach dem Bucket-Namen
          return parts.slice(3).join('/');
        }
      }

      // Wenn es schon ein Pfad ist (ohne gs:// oder https://)
      if (!url.startsWith('http') && !url.startsWith('gs://')) {
        return url;
      }
    } catch (e) {
      console.error('Fehler beim Extrahieren des Speicherpfads:', e);
    }

    return null;
  }

  // Aktualisierte URL für ein Bild abrufen
  async getRefreshedImageUrl(path: string): Promise<string> {
    try {
      // Nutze die bestehende getImageUrl-Methode
      return await this.getImageUrl(path);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Bild-URL:', error);
      throw error;
    }
  }
}

export default new ImageService();
