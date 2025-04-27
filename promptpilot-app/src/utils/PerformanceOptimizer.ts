/**
 * Dienstprogramm zur Optimierung der App-Leistung
 * Enthält Funktionen für Memoization, Caching und Leistungsüberwachung
 */

// Cache für Netzwerkanfragen
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheItem<any>> = new Map();
  
  // Singleton-Instanz
  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }
  
  // Daten im Cache speichern
  public set<T>(key: string, data: T, expiryInMinutes: number = 5): void {
    const timestamp = Date.now();
    const expiry = timestamp + expiryInMinutes * 60 * 1000;
    
    this.cache.set(key, {
      data,
      timestamp,
      expiry,
    });
  }
  
  // Daten aus dem Cache abrufen
  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Prüfen, ob der Cache-Eintrag abgelaufen ist
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }
  
  // Prüfen, ob ein Schlüssel im Cache existiert und gültig ist
  public has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    // Prüfen, ob der Cache-Eintrag abgelaufen ist
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  // Cache für einen bestimmten Schlüssel löschen
  public delete(key: string): void {
    this.cache.delete(key);
  }
  
  // Gesamten Cache löschen
  public clear(): void {
    this.cache.clear();
  }
  
  // Abgelaufene Cache-Einträge bereinigen
  public cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Leistungsüberwachung
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, { startTime: number; endTime?: number }> = new Map();
  
  // Singleton-Instanz
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  // Zeitmessung starten
  public startMeasure(id: string): void {
    this.metrics.set(id, { startTime: Date.now() });
  }
  
  // Zeitmessung beenden und Dauer zurückgeben
  public endMeasure(id: string): number {
    const metric = this.metrics.get(id);
    
    if (!metric) {
      console.warn(`Keine Messung mit ID "${id}" gefunden`);
      return 0;
    }
    
    metric.endTime = Date.now();
    const duration = metric.endTime - metric.startTime;
    
    console.log(`Leistungsmessung "${id}": ${duration}ms`);
    return duration;
  }
  
  // Alle Messungen löschen
  public clearMeasures(): void {
    this.metrics.clear();
  }
}

// Memoization-Funktion für teure Berechnungen
function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();
  
  return (...args: Parameters<T>): ReturnType<T> => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    
    return result;
  };
}

// Debounce-Funktion für Event-Handler
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>): void => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Throttle-Funktion für Event-Handler
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>): void => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// Verzögerte Ausführung von Funktionen
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Batch-Verarbeitung für Firestore-Operationen
async function batchProcess<T>(
  items: T[],
  processFn: (item: T) => Promise<void>,
  batchSize: number = 10
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(processFn));
  }
}

export {
  CacheManager,
  PerformanceMonitor,
  memoize,
  debounce,
  throttle,
  delay,
  batchProcess,
};
