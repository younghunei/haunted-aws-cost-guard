import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import exportRoutes from '../routes/exportRoutes';

// Mock the export service
jest.mock('../services/exportService', () => ({
  exportService: {
    createShareableLink: jest.fn(),
    getSharedData: jest.fn(),
    getShareStatistics: jest.fn(),
    getAllActiveShares: jest.fn(),
    cleanupExpiredShares: jest.fn(),
    generateCSV: jest.fn(),
    generateDetailedCSV: jest.fn(),
    generateJSONExport: jest.fn(),
    getCacheStats: jest.fn(),
    isValidShareId: jest.fn()
  }
}));

import { exportService } from '../services/exportService';
const mockExportService = exportService as jest.Mocked<typeof exportService>;

const app = express();
app.use(express.json());
app.use('/api/export', exportRoutes);

describe('Export Routes', () => {
  const mockSnapshot = {
    timestamp: new Date(),
    services: [
      {
        service: 'ec2',
        displayName: 'EC2 Computing',
        totalCost: 1250,
        currency: 'USD',
        budgetUtilization: 0.85,
        regions: [],
        tags: [],
        dailyCosts: [],
        trend: 'increasing'
      }
    ],
    viewSettings: { zoom: 1, center: { x: 0, y: 0 }, showDetails: false },
    budgets: [],
    metadata: { version: '1.0.0', mode: 'demo', totalCost: 1250, currency: 'USD' }
  };

  const mockShareData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    snapshot: mockSnapshot,
    options: {
      expirationHours: 24,
      maxViews: 100,
      includeData: true,
      password: 'test123'
    },
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    viewCount: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/export/share', () => {
    it('should create shareable link successfully', async () => {
      mockExportService.createShareableLink.mockReturnValue(mockShareData);

      const response = await request(app)
        .post('/api/export/share')
        .send({
          snapshot: mockSnapshot,
          options: {
            expirationHours: 24,
            includeData: true
          }
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: mockShareData.id,
          expiresAt: expect.any(String),
          createdAt: expect.any(String)
        }
      });
      expect(mockExportService.createShareableLink).toHaveBeenCalledWith(
        expect.objectContaining({
          services: mockSnapshot.services,
          viewSettings: mockSnapshot.viewSettings,
          budgets: mockSnapshot.budgets,
          metadata: mockSnapshot.metadata
        }),
        expect.objectContaining({
          expirationHours: 24,
          includeData: true
        })
      );
    });

    it('should validate request data', async () => {
      const response = await request(app)
        .post('/api/export/share')
        .send({
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid request data'
      });
    });

    it('should handle service errors', async () => {
      mockExportService.createShareableLink.mockImplementation(() => {
        throw new Error('Service error');
      });

      const response = await request(app)
        .post('/api/export/share')
        .send({
          snapshot: mockSnapshot,
          options: { expirationHours: 24, includeData: true }
        });

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to create shareable link'
      });
    });

    it('should validate expiration hours range', async () => {
      const response = await request(app)
        .post('/api/export/share')
        .send({
          snapshot: mockSnapshot,
          options: {
            expirationHours: 10000, // Too high
            includeData: true
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate max views range', async () => {
      const response = await request(app)
        .post('/api/export/share')
        .send({
          snapshot: mockSnapshot,
          options: {
            expirationHours: 24,
            maxViews: 20000, // Too high
            includeData: true
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/export/share/:shareId', () => {
    const shareId = '123e4567-e89b-12d3-a456-426614174000';

    it('should retrieve shared data successfully', async () => {
      mockExportService.getSharedData.mockReturnValue(mockShareData);

      const response = await request(app)
        .get(`/api/export/share/${shareId}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          snapshot: expect.objectContaining({
            services: mockSnapshot.services,
            viewSettings: mockSnapshot.viewSettings,
            budgets: mockSnapshot.budgets,
            metadata: mockSnapshot.metadata
          }),
          viewCount: expect.any(Number),
          expiresAt: expect.any(String),
          createdAt: expect.any(String)
        }
      });
      expect(mockExportService.getSharedData).toHaveBeenCalledWith(shareId, undefined);
    });

    it('should handle password parameter', async () => {
      mockExportService.getSharedData.mockReturnValue(mockShareData);

      const response = await request(app)
        .get(`/api/export/share/${shareId}?password=test123`);

      expect(response.status).toBe(200);
      expect(mockExportService.getSharedData).toHaveBeenCalledWith(shareId, 'test123');
    });

    it('should return 404 for non-existent share', async () => {
      mockExportService.getSharedData.mockReturnValue(null);

      const response = await request(app)
        .get(`/api/export/share/${shareId}`);

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Shared link not found or expired'
      });
    });

    it('should return 401 for invalid password', async () => {
      mockExportService.getSharedData.mockImplementation(() => {
        throw new Error('Invalid password');
      });

      const response = await request(app)
        .get(`/api/export/share/${shareId}?password=wrong`);

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Password required or incorrect'
      });
    });

    it('should return 429 for max views exceeded', async () => {
      mockExportService.getSharedData.mockImplementation(() => {
        throw new Error('Maximum view limit reached');
      });

      const response = await request(app)
        .get(`/api/export/share/${shareId}`);

      expect(response.status).toBe(429);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Maximum view limit reached'
      });
    });

    it('should validate share ID format', async () => {
      const response = await request(app)
        .get('/api/export/share/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid share ID format'
      });
    });
  });

  describe('GET /api/export/share/:shareId/stats', () => {
    const shareId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return share statistics', async () => {
      const mockStats = {
        viewCount: 5,
        maxViews: 100,
        expiresAt: new Date(),
        createdAt: new Date()
      };
      mockExportService.getShareStatistics.mockReturnValue(mockStats);

      const response = await request(app)
        .get(`/api/export/share/${shareId}/stats`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          viewCount: 5,
          maxViews: 100,
          expiresAt: expect.any(String),
          createdAt: expect.any(String)
        }
      });
    });

    it('should return 404 for non-existent share', async () => {
      mockExportService.getShareStatistics.mockReturnValue(null);

      const response = await request(app)
        .get(`/api/export/share/${shareId}/stats`);

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Share not found'
      });
    });
  });

  describe('POST /api/export/csv', () => {
    const mockServices = [
      {
        service: 'ec2',
        displayName: 'EC2 Computing',
        totalCost: 1250,
        currency: 'USD',
        budgetUtilization: 0.85,
        trend: 'increasing'
      }
    ];

    it('should generate CSV successfully', async () => {
      const mockCSV = 'Service,Display Name,Total Cost\nec2,EC2 Computing,1250';
      mockExportService.generateCSV.mockReturnValue(mockCSV);

      const response = await request(app)
        .post('/api/export/csv')
        .send({ services: mockServices });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toBe('attachment; filename="cost-data.csv"');
      expect(response.text).toBe(mockCSV);
      expect(mockExportService.generateCSV).toHaveBeenCalledWith(mockServices);
    });

    it('should generate detailed CSV when requested', async () => {
      const mockDetailedCSV = 'Service,Display Name,Total Cost,Region\nec2,EC2 Computing,1250,us-east-1';
      mockExportService.generateDetailedCSV.mockReturnValue(mockDetailedCSV);

      const response = await request(app)
        .post('/api/export/csv')
        .send({ 
          services: mockServices,
          detailed: true
        });

      expect(response.status).toBe(200);
      expect(response.text).toBe(mockDetailedCSV);
      expect(mockExportService.generateDetailedCSV).toHaveBeenCalledWith(mockServices);
    });

    it('should validate request data', async () => {
      const response = await request(app)
        .post('/api/export/csv')
        .send({
          // Missing services array
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid request data'
      });
    });
  });

  describe('POST /api/export/json', () => {
    it('should generate JSON export successfully', async () => {
      const mockJSON = JSON.stringify({ ...mockSnapshot, exportedAt: new Date() });
      mockExportService.generateJSONExport.mockReturnValue(mockJSON);

      const response = await request(app)
        .post('/api/export/json')
        .send({ snapshot: mockSnapshot });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/json; charset=utf-8');
      expect(response.headers['content-disposition']).toBe('attachment; filename="mansion-data.json"');
      expect(response.text).toBe(mockJSON);
      expect(mockExportService.generateJSONExport).toHaveBeenCalledWith(
        expect.objectContaining({
          services: mockSnapshot.services,
          viewSettings: mockSnapshot.viewSettings,
          budgets: mockSnapshot.budgets,
          metadata: mockSnapshot.metadata
        })
      );
    });

    it('should validate request data', async () => {
      const response = await request(app)
        .post('/api/export/json')
        .send({
          // Missing snapshot
        });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid request data'
      });
    });
  });

  describe('GET /api/export/stats', () => {
    it('should return export statistics', async () => {
      const mockCacheStats = {
        keys: 5,
        hits: 10,
        misses: 2,
        ksize: 1024,
        vsize: 2048
      };
      const mockActiveShares = [mockShareData];

      mockExportService.getCacheStats.mockReturnValue(mockCacheStats);
      mockExportService.getAllActiveShares.mockReturnValue(mockActiveShares);

      const response = await request(app)
        .get('/api/export/stats');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          cache: mockCacheStats,
          activeShares: 1,
          shares: expect.arrayContaining([
            expect.objectContaining({
              id: mockShareData.id,
              viewCount: expect.any(Number),
              hasPassword: expect.any(Boolean)
            })
          ])
        }
      });
    });
  });

  describe('DELETE /api/export/cleanup', () => {
    it('should cleanup expired shares', async () => {
      mockExportService.cleanupExpiredShares.mockReturnValue(3);

      const response = await request(app)
        .delete('/api/export/cleanup');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          deletedCount: 3,
          message: 'Cleaned up 3 expired shares'
        }
      });
      expect(mockExportService.cleanupExpiredShares).toHaveBeenCalled();
    });

    it('should handle cleanup errors', async () => {
      mockExportService.cleanupExpiredShares.mockImplementation(() => {
        throw new Error('Cleanup failed');
      });

      const response = await request(app)
        .delete('/api/export/cleanup');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to cleanup expired shares'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockExportService.createShareableLink.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await request(app)
        .post('/api/export/share')
        .send({
          snapshot: mockSnapshot,
          options: { expirationHours: 24, includeData: true }
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeTruthy();
    });

    it('should validate JSON structure', async () => {
      const response = await request(app)
        .post('/api/export/share')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });
  });
});