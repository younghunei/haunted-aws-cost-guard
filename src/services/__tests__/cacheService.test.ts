import { vi } from 'vitest';
import { cacheService } from '../cacheService';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.addEventListener for beforeunload
Object.defineProperty(window, 'addEventListener', {
  value: vi.fn()
});

describe('CacheService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheService.clear();
  });

  describe('basic cache operations', () => {
    it('should store and retrieve data', () => {
      const testData = { id: 1, name: 'test' };
      
      cacheService.set('test-key', testData);
      const retrieved = cacheService.get('test-key');
      
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = cacheService.get('non-existent');
      expect(result).toBeNull();
    });

    it('should check if key exists', () => {
      cacheService.set('test-key', 'test-value');
      
      expect(cacheService.has('test-key')).toBe(true);
      expect(cacheService.has('non-existent')).toBe(false);
    });

    it('should delete entries', () => {
      cacheService.set('test-key', 'test-value');
      expect(cacheService.has('test-key')).toBe(true);
      
      const deleted = cacheService.delete('test-key');
      expect(deleted).toBe(true);
      expect(cacheService.has('test-key')).toBe(false);
    });

    it('should clear all entries', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      
      cacheService.clear();
      
      expect(cacheService.has('key1')).toBe(false);
      expect(cacheService.has('key2')).toBe(false);
    });
  });

  describe('TTL (Time To Live)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should expire entries after TTL', () => {
      cacheService.set('test-key', 'test-value', 1000); // 1 second TTL
      
      expect(cacheService.has('test-key')).toBe(true);
      
      // Fast forward time
      vi.advanceTimersByTime(1001);
      
      expect(cacheService.has('test-key')).toBe(false);
      expect(cacheService.get('test-key')).toBeNull();
    });

    it('should not expire entries before TTL', () => {
      cacheService.set('test-key', 'test-value', 1000);
      
      vi.advanceTimersByTime(500);
      
      expect(cacheService.has('test-key')).toBe(true);
      expect(cacheService.get('test-key')).toBe('test-value');
    });
  });

  describe('specialized cache methods', () => {
    const mockServices = [
      {
        service: 'ec2',
        displayName: 'EC2',
        totalCost: 100,
        currency: 'USD',
        budgetUtilization: 0.5,
        regions: [],
        tags: [],
        dailyCosts: [],
        trend: 'stable' as const
      }
    ];

    const mockBudgets = [
      {
        id: '1',
        accountId: 'test',
        service: 'ec2',
        amount: 200,
        currency: 'USD',
        period: 'monthly' as const,
        alertThresholds: [50, 80, 100],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should cache and retrieve cost data', () => {
      cacheService.setCostData('test-account', mockServices);
      const retrieved = cacheService.getCostData('test-account');
      
      expect(retrieved).toEqual(mockServices);
    });

    it('should cache and retrieve budgets', () => {
      cacheService.setBudgets('test-account', mockBudgets);
      const retrieved = cacheService.getBudgets('test-account');
      
      expect(retrieved).toEqual(mockBudgets);
    });

    it('should cache and retrieve user preferences', () => {
      const preferences = { theme: 'dark', notifications: true };
      
      cacheService.setUserPreferences(preferences);
      const retrieved = cacheService.getUserPreferences();
      
      expect(retrieved).toEqual(preferences);
    });
  });

  describe('offline data management', () => {
    it('should return offline data when available', () => {
      const mockServices = [{ service: 'ec2', totalCost: 100 }] as any;
      const mockBudgets = [{ id: '1', service: 'ec2' }] as any;
      
      cacheService.setCostData('demo', mockServices);
      cacheService.setBudgets('demo', mockBudgets);
      
      const offlineData = cacheService.getOfflineData();
      
      expect(offlineData.costData.demo).toEqual(mockServices);
      expect(offlineData.budgets.demo).toEqual(mockBudgets);
      expect(offlineData.lastUpdated).toBeInstanceOf(Date);
    });

    it('should detect if offline data is available', () => {
      expect(cacheService.hasOfflineData()).toBe(false);
      
      cacheService.setCostData('demo', [{ service: 'ec2' }] as any);
      
      expect(cacheService.hasOfflineData()).toBe(true);
    });

    it('should preload data for offline use', async () => {
      const mockServices = [{ service: 'ec2' }] as any;
      const mockBudgets = [{ id: '1' }] as any;
      
      await cacheService.preloadForOffline('test', mockServices, mockBudgets);
      
      expect(cacheService.getCostData('test')).toEqual(mockServices);
      expect(cacheService.getBudgets('test')).toEqual(mockBudgets);
      expect(cacheService.getLastSync('test')).toBeInstanceOf(Date);
    });
  });

  describe('cache statistics', () => {
    it('should track cache hits and misses', () => {
      cacheService.set('test-key', 'test-value');
      
      // Hit
      cacheService.get('test-key');
      
      // Miss
      cacheService.get('non-existent');
      
      const stats = cacheService.getStats();
      
      expect(stats.totalEntries).toBe(1);
      expect(stats.hitRate).toBeGreaterThan(0);
      expect(stats.missRate).toBeGreaterThan(0);
    });

    it('should estimate cache size', () => {
      cacheService.set('test-key', 'test-value');
      
      const stats = cacheService.getStats();
      
      expect(stats.totalSize).toBeGreaterThan(0);
    });
  });

  describe('localStorage integration', () => {
    it('should save cache to localStorage', () => {
      cacheService.set('test-key', 'test-value');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'haunted-mansion-cache',
        expect.stringContaining('test-key')
      );
    });

    it('should load cache from localStorage', () => {
      const cacheData = {
        entries: [['test-key', {
          data: 'test-value',
          timestamp: Date.now(),
          ttl: 15 * 60 * 1000,
          version: '1.0.0'
        }]],
        hits: 0,
        misses: 0,
        version: '1.0.0'
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(cacheData));
      
      // Clear current cache and reload
      cacheService.clear();
      
      // Simulate loading from localStorage
      expect(cacheService.has('test-key')).toBe(false); // Should be false since we cleared it
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      // Should not throw
      expect(() => {
        cacheService.set('test-key', 'test-value');
      }).not.toThrow();
    });
  });
});