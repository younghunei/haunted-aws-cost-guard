import { ServiceCost, Budget, BudgetUtilization } from '../store/hauntedStore';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: string;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number; // Approximate size in bytes
  hitRate: number;
  missRate: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;
  private readonly maxSize = 50; // Maximum number of cache entries
  private readonly defaultTTL = 15 * 60 * 1000; // 15 minutes
  private readonly version = '1.0.0';

  private constructor() {
    // Load cache from localStorage on initialization
    this.loadFromStorage();
    
    // Set up periodic cleanup
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
    
    // Save cache to localStorage before page unload
    window.addEventListener('beforeunload', () => this.saveToStorage());
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Store data in cache
   */
  public set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: this.version
    };

    this.cache.set(key, entry);
    this.saveToStorage();
  }

  /**
   * Retrieve data from cache
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Check version compatibility
    if (entry.version !== this.version) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data;
  }

  /**
   * Check if data exists in cache and is valid
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry) && entry.version === this.version;
  }

  /**
   * Remove data from cache
   */
  public delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.saveToStorage();
    return result;
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.saveToStorage();
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    return {
      totalEntries: this.cache.size,
      totalSize: this.estimateSize(),
      hitRate: totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0,
      missRate: totalRequests > 0 ? (this.misses / totalRequests) * 100 : 0
    };
  }

  /**
   * Cache service cost data
   */
  public setCostData(accountId: string, services: ServiceCost[], ttl?: number): void {
    this.set(`cost-data-${accountId}`, services, ttl);
  }

  /**
   * Get cached service cost data
   */
  public getCostData(accountId: string): ServiceCost[] | null {
    return this.get<ServiceCost[]>(`cost-data-${accountId}`);
  }

  /**
   * Cache budget data
   */
  public setBudgets(accountId: string, budgets: Budget[], ttl?: number): void {
    this.set(`budgets-${accountId}`, budgets, ttl);
  }

  /**
   * Get cached budget data
   */
  public getBudgets(accountId: string): Budget[] | null {
    return this.get<Budget[]>(`budgets-${accountId}`);
  }

  /**
   * Cache budget utilizations
   */
  public setBudgetUtilizations(accountId: string, utilizations: BudgetUtilization[], ttl?: number): void {
    this.set(`budget-utilizations-${accountId}`, utilizations, ttl);
  }

  /**
   * Get cached budget utilizations
   */
  public getBudgetUtilizations(accountId: string): BudgetUtilization[] | null {
    return this.get<BudgetUtilization[]>(`budget-utilizations-${accountId}`);
  }

  /**
   * Cache user preferences
   */
  public setUserPreferences(preferences: any): void {
    this.set('user-preferences', preferences, 30 * 24 * 60 * 60 * 1000); // 30 days
  }

  /**
   * Get cached user preferences
   */
  public getUserPreferences(): any | null {
    return this.get('user-preferences');
  }

  /**
   * Get all available cached data for offline mode
   */
  public getOfflineData(): {
    costData: { [accountId: string]: ServiceCost[] };
    budgets: { [accountId: string]: Budget[] };
    utilizations: { [accountId: string]: BudgetUtilization[] };
    lastUpdated: Date | null;
  } {
    const offlineData = {
      costData: {} as { [accountId: string]: ServiceCost[] },
      budgets: {} as { [accountId: string]: Budget[] },
      utilizations: {} as { [accountId: string]: BudgetUtilization[] },
      lastUpdated: null as Date | null
    };

    let latestTimestamp = 0;

    // Collect all cached data
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry) || entry.version !== this.version) {
        continue;
      }

      if (key.startsWith('cost-data-')) {
        const accountId = key.replace('cost-data-', '');
        offlineData.costData[accountId] = entry.data;
        latestTimestamp = Math.max(latestTimestamp, entry.timestamp);
      } else if (key.startsWith('budgets-')) {
        const accountId = key.replace('budgets-', '');
        offlineData.budgets[accountId] = entry.data;
        latestTimestamp = Math.max(latestTimestamp, entry.timestamp);
      } else if (key.startsWith('budget-utilizations-')) {
        const accountId = key.replace('budget-utilizations-', '');
        offlineData.utilizations[accountId] = entry.data;
        latestTimestamp = Math.max(latestTimestamp, entry.timestamp);
      }
    }

    if (latestTimestamp > 0) {
      offlineData.lastUpdated = new Date(latestTimestamp);
    }

    return offlineData;
  }

  /**
   * Check if we have sufficient offline data
   */
  public hasOfflineData(): boolean {
    const offlineData = this.getOfflineData();
    return Object.keys(offlineData.costData).length > 0 || 
           Object.keys(offlineData.budgets).length > 0;
  }

  /**
   * Preload data for offline use
   */
  public async preloadForOffline(accountId: string, services: ServiceCost[], budgets: Budget[]): Promise<void> {
    // Cache with longer TTL for offline use
    const offlineTTL = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    this.setCostData(accountId, services, offlineTTL);
    this.setBudgets(accountId, budgets, offlineTTL);
    
    // Also cache a timestamp for when data was last synced
    this.set(`last-sync-${accountId}`, new Date(), offlineTTL);
  }

  /**
   * Get last sync timestamp
   */
  public getLastSync(accountId: string): Date | null {
    return this.get<Date>(`last-sync-${accountId}`);
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry) || entry.version !== this.version) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      this.saveToStorage();
    }
  }

  private estimateSize(): number {
    let size = 0;
    for (const entry of this.cache.values()) {
      size += JSON.stringify(entry).length * 2; // Rough estimate (UTF-16)
    }
    return size;
  }

  private saveToStorage(): void {
    try {
      const cacheData = {
        entries: Array.from(this.cache.entries()),
        hits: this.hits,
        misses: this.misses,
        version: this.version
      };
      
      localStorage.setItem('haunted-mansion-cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('haunted-mansion-cache');
      if (!stored) return;

      const cacheData = JSON.parse(stored);
      
      // Check version compatibility
      if (cacheData.version !== this.version) {
        localStorage.removeItem('haunted-mansion-cache');
        return;
      }

      // Restore cache entries
      this.cache = new Map(cacheData.entries || []);
      this.hits = cacheData.hits || 0;
      this.misses = cacheData.misses || 0;

      // Clean up expired entries
      this.cleanup();
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
      localStorage.removeItem('haunted-mansion-cache');
    }
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();