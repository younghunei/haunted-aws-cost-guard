import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { exportService } from '../services/exportService';

describe('ExportService', () => {
  const mockSnapshot = {
    timestamp: new Date(),
    services: [
      {
        service: 'ec2',
        displayName: 'EC2 Computing',
        totalCost: 1250,
        currency: 'USD',
        budgetUtilization: 0.85,
        regions: [
          { region: 'us-east-1', cost: 500, percentage: 40 },
          { region: 'us-west-2', cost: 375, percentage: 30 }
        ],
        tags: [
          { key: 'Environment', value: 'Production', cost: 750, percentage: 60 }
        ],
        dailyCosts: [
          { date: '2023-11-18', cost: 120 },
          { date: '2023-11-19', cost: 135 }
        ],
        trend: 'increasing'
      }
    ],
    viewSettings: {
      zoom: 1.2,
      center: { x: 100, y: 50 },
      showDetails: true
    },
    budgets: [],
    metadata: {
      version: '1.0.0',
      mode: 'demo',
      totalCost: 1250,
      currency: 'USD'
    }
  };

  const mockShareOptions = {
    expirationHours: 24,
    maxViews: 100,
    includeData: true,
    password: 'test123'
  };

  beforeEach(() => {
    // Clear any existing cache data
    exportService['shareCache'].flushAll();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createShareableLink', () => {
    it('should create a shareable link with valid data', () => {
      const shareData = exportService.createShareableLink(mockSnapshot, mockShareOptions);

      expect(shareData).toMatchObject({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
        snapshot: mockSnapshot,
        options: mockShareOptions,
        viewCount: 0
      });
      expect(shareData.createdAt).toBeInstanceOf(Date);
      expect(shareData.expiresAt).toBeInstanceOf(Date);
      expect(shareData.expiresAt.getTime()).toBeGreaterThan(shareData.createdAt.getTime());
    });

    it('should calculate correct expiration time', () => {
      const options = { ...mockShareOptions, expirationHours: 48 };
      const shareData = exportService.createShareableLink(mockSnapshot, options);

      const expectedExpiration = new Date(shareData.createdAt.getTime() + 48 * 60 * 60 * 1000);
      const timeDiff = Math.abs(shareData.expiresAt.getTime() - expectedExpiration.getTime());
      
      // Allow for small timing differences (less than 1 second)
      expect(timeDiff).toBeLessThan(1000);
    });

    it('should store data in cache', () => {
      const shareData = exportService.createShareableLink(mockSnapshot, mockShareOptions);
      const cachedData = exportService['shareCache'].get(shareData.id);

      expect(cachedData).toEqual(shareData);
    });
  });

  describe('getSharedData', () => {
    let shareId: string;

    beforeEach(() => {
      const shareData = exportService.createShareableLink(mockSnapshot, mockShareOptions);
      shareId = shareData.id;
    });

    it('should retrieve shared data successfully', () => {
      const result = exportService.getSharedData(shareId, 'test123');

      expect(result).toMatchObject({
        snapshot: mockSnapshot,
        options: mockShareOptions,
        viewCount: 1 // Should increment after access
      });
    });

    it('should increment view count on each access', () => {
      exportService.getSharedData(shareId, 'test123');
      const result = exportService.getSharedData(shareId, 'test123');

      expect(result?.viewCount).toBe(2);
    });

    it('should return null for non-existent share ID', () => {
      const result = exportService.getSharedData('non-existent-id');

      expect(result).toBeNull();
    });

    it('should throw error for incorrect password', () => {
      expect(() => {
        exportService.getSharedData(shareId, 'wrong-password');
      }).toThrow('Invalid password');
    });

    it('should work without password when none is set', () => {
      const noPasswordOptions = { ...mockShareOptions, password: undefined };
      const shareData = exportService.createShareableLink(mockSnapshot, noPasswordOptions);
      
      const result = exportService.getSharedData(shareData.id);

      expect(result).toBeTruthy();
      expect(result?.viewCount).toBe(1);
    });

    it('should throw error when max views exceeded', () => {
      const limitedOptions = { ...mockShareOptions, maxViews: 2 };
      const shareData = exportService.createShareableLink(mockSnapshot, limitedOptions);

      // Access twice to reach limit
      exportService.getSharedData(shareData.id, 'test123');
      exportService.getSharedData(shareData.id, 'test123');

      // Third access should fail
      expect(() => {
        exportService.getSharedData(shareData.id, 'test123');
      }).toThrow('Maximum view limit reached');
    });

    it('should handle expired shares', () => {
      // Create share with very short expiration
      const expiredOptions = { ...mockShareOptions, expirationHours: 0.001 }; // ~3.6 seconds
      const shareData = exportService.createShareableLink(mockSnapshot, expiredOptions);

      // Wait for expiration (simulate by manually setting past date)
      shareData.expiresAt = new Date(Date.now() - 1000);
      exportService['shareCache'].set(shareData.id, shareData);

      const result = exportService.getSharedData(shareData.id, 'test123');

      expect(result).toBeNull();
    });
  });

  describe('getShareStatistics', () => {
    let shareId: string;

    beforeEach(() => {
      const shareData = exportService.createShareableLink(mockSnapshot, mockShareOptions);
      shareId = shareData.id;
    });

    it('should return correct statistics', () => {
      // Access the share to increment view count
      exportService.getSharedData(shareId, 'test123');

      const stats = exportService.getShareStatistics(shareId);

      expect(stats).toMatchObject({
        viewCount: 1,
        maxViews: 100
      });
      expect(stats?.expiresAt).toBeInstanceOf(Date);
      expect(stats?.createdAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent share', () => {
      const stats = exportService.getShareStatistics('non-existent-id');

      expect(stats).toBeNull();
    });
  });

  describe('cleanupExpiredShares', () => {
    it('should remove expired shares', () => {
      // Create expired share
      const expiredOptions = { ...mockShareOptions, expirationHours: 0.001 };
      const expiredShare = exportService.createShareableLink(mockSnapshot, expiredOptions);
      
      // Create valid share
      const validShare = exportService.createShareableLink(mockSnapshot, mockShareOptions);

      // Manually expire the first share
      const expiredData = exportService['shareCache'].get(expiredShare.id) as any;
      if (expiredData) {
        expiredData.expiresAt = new Date(Date.now() - 1000);
        exportService['shareCache'].set(expiredShare.id, expiredData);
      }

      const deletedCount = exportService.cleanupExpiredShares();

      expect(deletedCount).toBe(1);
      expect(exportService.getShareStatistics(expiredShare.id)).toBeNull();
      expect(exportService.getShareStatistics(validShare.id)).toBeTruthy();
    });

    it('should return 0 when no expired shares exist', () => {
      exportService.createShareableLink(mockSnapshot, mockShareOptions);

      const deletedCount = exportService.cleanupExpiredShares();

      expect(deletedCount).toBe(0);
    });
  });

  describe('getAllActiveShares', () => {
    it('should return all non-expired shares', () => {
      const share1 = exportService.createShareableLink(mockSnapshot, mockShareOptions);
      const share2 = exportService.createShareableLink(mockSnapshot, mockShareOptions);

      const activeShares = exportService.getAllActiveShares();

      expect(activeShares).toHaveLength(2);
      expect(activeShares.map(s => s.id)).toContain(share1.id);
      expect(activeShares.map(s => s.id)).toContain(share2.id);
    });

    it('should exclude expired shares', () => {
      const validShare = exportService.createShareableLink(mockSnapshot, mockShareOptions);
      
      // Create and expire a share
      const expiredShare = exportService.createShareableLink(mockSnapshot, mockShareOptions);
      const expiredData = exportService['shareCache'].get(expiredShare.id) as any;
      if (expiredData) {
        expiredData.expiresAt = new Date(Date.now() - 1000);
        exportService['shareCache'].set(expiredShare.id, expiredData);
      }

      const activeShares = exportService.getAllActiveShares();

      expect(activeShares).toHaveLength(1);
      expect(activeShares[0].id).toBe(validShare.id);
    });
  });

  describe('generateCSV', () => {
    const mockServices = [
      {
        service: 'ec2',
        displayName: 'EC2 Computing',
        totalCost: 1250,
        currency: 'USD',
        budgetUtilization: 0.85,
        trend: 'increasing',
        regions: [{ region: 'us-east-1', cost: 500, percentage: 40 }],
        dailyCosts: [{ date: '2023-11-18', cost: 120 }]
      },
      {
        service: 's3',
        displayName: 'S3 Storage',
        totalCost: 340,
        currency: 'USD',
        budgetUtilization: 0.34,
        trend: 'stable',
        regions: [{ region: 'us-west-2', cost: 340, percentage: 100 }],
        dailyCosts: [{ date: '2023-11-18', cost: 45 }]
      }
    ];

    it('should generate valid CSV format', () => {
      const csv = exportService.generateCSV(mockServices);
      const lines = csv.split('\n');

      expect(lines[0]).toContain('Service');
      expect(lines[0]).toContain('Display Name');
      expect(lines[0]).toContain('Total Cost');
      expect(lines.length).toBe(3); // Header + 2 services
    });

    it('should handle services without regions or daily costs', () => {
      const servicesWithoutDetails = [
        {
          service: 'lambda',
          displayName: 'Lambda Functions',
          totalCost: 50,
          currency: 'USD',
          budgetUtilization: 0.25,
          trend: 'stable'
        }
      ];

      expect(() => {
        exportService.generateCSV(servicesWithoutDetails);
      }).not.toThrow();
    });

    it('should properly escape CSV fields', () => {
      const servicesWithSpecialChars = [
        {
          service: 'test',
          displayName: 'Service with "quotes" and, commas',
          totalCost: 100,
          currency: 'USD',
          budgetUtilization: 0.5,
          trend: 'stable'
        }
      ];

      const csv = exportService.generateCSV(servicesWithSpecialChars);
      
      expect(csv).toContain('Service with "quotes" and, commas');
    });
  });

  describe('generateDetailedCSV', () => {
    const mockServices = [
      {
        service: 'ec2',
        displayName: 'EC2 Computing',
        totalCost: 1250,
        currency: 'USD',
        budgetUtilization: 0.85,
        trend: 'increasing',
        regions: [
          { region: 'us-east-1', cost: 500, percentage: 40 },
          { region: 'us-west-2', cost: 375, percentage: 30 }
        ],
        tags: [
          { key: 'Environment', value: 'Production', cost: 750, percentage: 60 }
        ],
        dailyCosts: [
          { date: '2023-11-18', cost: 120 },
          { date: '2023-11-19', cost: 135 }
        ]
      }
    ];

    it('should generate detailed CSV with all breakdowns', () => {
      const csv = exportService.generateDetailedCSV(mockServices);
      const lines = csv.split('\n');

      // Should have header + regions + tags + daily costs
      expect(lines.length).toBeGreaterThan(5);
      
      // Check for regional data
      expect(csv).toContain('us-east-1');
      expect(csv).toContain('us-west-2');
      
      // Check for tag data
      expect(csv).toContain('Environment');
      expect(csv).toContain('Production');
      
      // Check for daily data
      expect(csv).toContain('2023-11-18');
      expect(csv).toContain('2023-11-19');
    });

    it('should handle empty services array', () => {
      const csv = exportService.generateDetailedCSV([]);
      const lines = csv.split('\n');

      expect(lines.length).toBe(1); // Only header
    });
  });

  describe('generateJSONExport', () => {
    it('should generate JSON with metadata', () => {
      const jsonString = exportService.generateJSONExport(mockSnapshot);
      const parsed = JSON.parse(jsonString);

      expect(parsed).toMatchObject({
        services: mockSnapshot.services,
        viewSettings: mockSnapshot.viewSettings,
        budgets: mockSnapshot.budgets,
        metadata: mockSnapshot.metadata,
        exportVersion: '1.0.0',
        exportedBy: 'Haunted AWS Cost Guard'
      });
      expect(parsed.exportedAt).toBeTruthy();
      expect(parsed.exportedAt).toBeTruthy();
    });

    it('should produce valid JSON', () => {
      const jsonString = exportService.generateJSONExport(mockSnapshot);

      expect(() => JSON.parse(jsonString)).not.toThrow();
    });
  });

  describe('isValidShareId', () => {
    it('should validate correct UUID format', () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000';
      expect(exportService.isValidShareId(validId)).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(exportService.isValidShareId('invalid-id')).toBe(false);
      expect(exportService.isValidShareId('123')).toBe(false);
      expect(exportService.isValidShareId('')).toBe(false);
      expect(exportService.isValidShareId('123e4567-e89b-12d3-a456')).toBe(false);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      exportService.createShareableLink(mockSnapshot, mockShareOptions);

      const stats = exportService.getCacheStats();

      expect(stats).toHaveProperty('keys');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats.keys).toBeGreaterThan(0);
    });
  });
});