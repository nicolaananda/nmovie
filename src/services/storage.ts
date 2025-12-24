/**
 * Web Storage Service - LocalStorage wrapper with AsyncStorage-compatible API
 * Replaces React Native MMKV for web
 */

class WebStorage {
  private static instance: WebStorage;
  private cache = new Map<string, { value: any; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds
  private readonly MAX_CACHE_SIZE = 100;

  private constructor() {
    // Initialize
  }

  public static getInstance(): WebStorage {
    if (!WebStorage.instance) {
      WebStorage.instance = new WebStorage();
    }
    return WebStorage.instance;
  }

  // Cache management
  private getCached(key: string): string | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCached(key: string, value: any): void {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  private invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // AsyncStorage-compatible API
  async getItem(key: string): Promise<string | null> {
    try {
      const cached = this.getCached(key);
      if (cached !== null) {
        return cached;
      }

      const value = localStorage.getItem(key);
      if (value !== null) {
        this.setCached(key, value);
      }

      return value;
    } catch (error) {
      console.error(`[WebStorage] Error getting item ${key}:`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
      this.setCached(key, value);
    } catch (error) {
      console.error(`[WebStorage] Error setting item ${key}:`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
      this.invalidateCache(key);
    } catch (error) {
      console.error(`[WebStorage] Error removing item ${key}:`, error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('[WebStorage] Error getting all keys:', error);
      return [];
    }
  }

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    try {
      const results: [string, string | null][] = [];
      for (const key of keys) {
        const value = localStorage.getItem(key);
        results.push([key, value]);
      }
      return results;
    } catch (error) {
      console.error('[WebStorage] Error in multiGet:', error);
      return keys.map(key => [key, null] as [string, string | null]);
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
      this.cache.clear();
    } catch (error) {
      console.error('[WebStorage] Error clearing storage:', error);
    }
  }

  // Direct access methods
  getString(key: string): string | undefined {
    return localStorage.getItem(key) || undefined;
  }

  setString(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  getNumber(key: string): number | undefined {
    const value = localStorage.getItem(key);
    return value !== null ? parseFloat(value) : undefined;
  }

  setNumber(key: string, value: number): void {
    localStorage.setItem(key, value.toString());
  }

  getBoolean(key: string): boolean | undefined {
    const value = localStorage.getItem(key);
    return value !== null ? value === 'true' : undefined;
  }

  setBoolean(key: string, value: boolean): void {
    localStorage.setItem(key, value.toString());
  }

  contains(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  delete(key: string): void {
    localStorage.removeItem(key);
  }

  // Additional AsyncStorage-compatible methods
  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    try {
      for (const [key, value] of keyValuePairs) {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('[WebStorage] Error in multiSet:', error);
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    try {
      for (const key of keys) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('[WebStorage] Error in multiRemove:', error);
    }
  }
}

export const webStorage = WebStorage.getInstance();

