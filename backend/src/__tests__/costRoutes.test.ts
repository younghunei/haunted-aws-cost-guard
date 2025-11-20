import request from 'supertest';
import app from '../app';

describe('Cost Routes', () => {
  describe('GET /api/cost/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/cost/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: 'healthy'
        },
        message: 'Cost API is running'
      });
      expect(response.body.data.timestamp).toBeDefined();
    });
  });

  describe('GET /api/cost/demo', () => {
    it('should return demo cost data', async () => {
      const response = await request(app)
        .get('/api/cost/demo')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Demo data retrieved successfully'
      });
      expect(response.body.data).toBeDefined();
      expect(response.body.data.services).toBeInstanceOf(Array);
      expect(response.body.data.totalCost).toBeGreaterThan(0);
      expect(response.body.data.currency).toBe('USD');
    });

    it('should return services with required properties', async () => {
      const response = await request(app)
        .get('/api/cost/demo')
        .expect(200);

      const services = response.body.data.services;
      expect(services.length).toBeGreaterThan(0);

      services.forEach((service: any) => {
        expect(service).toHaveProperty('service');
        expect(service).toHaveProperty('displayName');
        expect(service).toHaveProperty('totalCost');
        expect(service).toHaveProperty('currency');
        expect(service).toHaveProperty('budgetUtilization');
        expect(service).toHaveProperty('regions');
        expect(service).toHaveProperty('tags');
        expect(service).toHaveProperty('dailyCosts');
        expect(service).toHaveProperty('trend');
      });
    });
  });

  describe('GET /api/cost/demo/scenarios', () => {
    it('should return demo scenarios', async () => {
      const response = await request(app)
        .get('/api/cost/demo/scenarios')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Demo scenarios retrieved successfully'
      });
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);

      response.body.data.forEach((scenario: any) => {
        expect(scenario).toHaveProperty('id');
        expect(scenario).toHaveProperty('name');
        expect(scenario).toHaveProperty('description');
      });
    });
  });

  describe('POST /api/cost/validate-credentials', () => {
    it('should reject request without credentials', async () => {
      const response = await request(app)
        .post('/api/cost/validate-credentials')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false
      });
      expect(response.body.error).toContain('Validation error');
    });

    it('should reject request with incomplete credentials', async () => {
      const response = await request(app)
        .post('/api/cost/validate-credentials')
        .send({
          accessKeyId: 'AKIA123'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false
      });
      expect(response.body.error).toContain('Validation error');
    });

    it('should handle invalid credentials gracefully', async () => {
      const response = await request(app)
        .post('/api/cost/validate-credentials')
        .send({
          accessKeyId: 'INVALID_KEY',
          secretAccessKey: 'invalid_secret',
          region: 'us-east-1'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        data: { valid: false }
      });
      expect(response.body.error).toContain('Invalid AWS credentials');
    });
  });

  describe('POST /api/cost/mode', () => {
    it('should accept demo mode selection', async () => {
      const response = await request(app)
        .post('/api/cost/mode')
        .send({
          mode: 'demo'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: { mode: 'demo' },
        message: 'Successfully switched to demo mode'
      });
    });

    it('should reject invalid mode', async () => {
      const response = await request(app)
        .post('/api/cost/mode')
        .send({
          mode: 'invalid'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false
      });
      expect(response.body.error).toContain('Validation error');
    });

    it('should require credentials for AWS mode', async () => {
      const response = await request(app)
        .post('/api/cost/mode')
        .send({
          mode: 'aws'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false
      });
      expect(response.body.error).toContain('Validation error');
    });
  });

  describe('GET /api/cost/aws', () => {
    it('should handle AWS data request without credentials', async () => {
      const response = await request(app)
        .get('/api/cost/aws')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false
      });
      expect(response.body.error).toContain('AWS credentials not validated');
    });
  });

  describe('GET /api/cost/aws/services', () => {
    it('should handle request for available services without credentials', async () => {
      const response = await request(app)
        .get('/api/cost/aws/services')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false
      });
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/cost/aws/refresh', () => {
    it('should handle cache refresh request', async () => {
      const response = await request(app)
        .post('/api/cost/aws/refresh')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: { refreshed: true },
        message: 'Cost data cache cleared, next request will fetch fresh data'
      });
    });
  });

  describe('GET /api/cost/aws/cache-stats', () => {
    it('should return cache statistics', async () => {
      const response = await request(app)
        .get('/api/cost/aws/cache-stats')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Cache statistics retrieved successfully'
      });
      expect(response.body.data).toHaveProperty('keys');
      expect(response.body.data).toHaveProperty('hits');
      expect(response.body.data).toHaveProperty('misses');
    });
  });

  describe('POST /api/cost/upload-csv', () => {
    it('should reject request without file', async () => {
      const response = await request(app)
        .post('/api/cost/upload-csv')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'No CSV file provided'
      });
    });

    it('should handle valid CSV upload', async () => {
      const csvContent = 'Service,BlendedCost,Region\nAmazon EC2,100.00,us-east-1';
      
      const response = await request(app)
        .post('/api/cost/upload-csv')
        .attach('csvFile', Buffer.from(csvContent), 'test.csv')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true
      });
      expect(response.body.data).toBeDefined();
      expect(response.body.message).toContain('CSV processed successfully');
    });

    it('should reject non-CSV files', async () => {
      const response = await request(app)
        .post('/api/cost/upload-csv')
        .attach('csvFile', Buffer.from('not a csv'), 'test.txt')
        .expect(400);

      expect(response.body.error).toContain('Only CSV files are allowed');
    });
  });

  describe('POST /api/cost/validate-csv', () => {
    it('should validate CSV format', async () => {
      const csvContent = 'Service,BlendedCost,Region\nAmazon EC2,100.00,us-east-1';
      
      const response = await request(app)
        .post('/api/cost/validate-csv')
        .attach('csvFile', Buffer.from(csvContent), 'test.csv')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          valid: true
        },
        message: 'CSV format is valid'
      });
    });

    it('should reject invalid CSV format', async () => {
      const csvContent = 'Invalid,Headers\nvalue1,value2';
      
      const response = await request(app)
        .post('/api/cost/validate-csv')
        .attach('csvFile', Buffer.from(csvContent), 'test.csv')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        data: {
          valid: false
        }
      });
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/cost/aws/test-connection', () => {
    it('should test AWS connection', async () => {
      const response = await request(app)
        .get('/api/cost/aws/test-connection')
        .expect(503);

      expect(response.body).toMatchObject({
        success: false,
        data: { connected: false },
        message: 'AWS connection failed'
      });
    });
  });
});