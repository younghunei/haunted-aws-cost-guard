import request from 'supertest';
import express from 'express';
import budgetRoutes from '../routes/budgetRoutes';
import { budgetService } from '../services/budgetService';

const app = express();
app.use(express.json());
app.use('/api/budget', budgetRoutes);

describe('Budget Routes', () => {
  beforeEach(() => {
    // Clear all budgets before each test
    const budgets = budgetService.getBudgets('test');
    budgets.forEach(budget => budgetService.deleteBudget(budget.id));
  });

  describe('GET /api/budget/:accountId', () => {
    it('should get all budgets for an account', async () => {
      // Create test budgets
      budgetService.saveBudget({
        accountId: 'test',
        service: 'ec2',
        amount: 1000,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      });

      budgetService.saveBudget({
        accountId: 'test',
        service: 's3',
        amount: 500,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      });

      const response = await request(app)
        .get('/api/budget/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('accountId', 'test');
    });

    it('should return empty array for account with no budgets', async () => {
      const response = await request(app)
        .get('/api/budget/nonexistent')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/budget/:accountId/:service', () => {
    it('should get budget for specific service', async () => {
      const budget = budgetService.saveBudget({
        accountId: 'test',
        service: 'ec2',
        amount: 1000,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      });

      const response = await request(app)
        .get('/api/budget/test/ec2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(budget.id);
      expect(response.body.data.service).toBe('ec2');
    });

    it('should return 404 for non-existent budget', async () => {
      const response = await request(app)
        .get('/api/budget/test/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Budget not found');
    });
  });

  describe('POST /api/budget', () => {
    it('should create a new budget', async () => {
      const budgetData = {
        accountId: 'test',
        service: 'ec2',
        amount: 1000,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      };

      const response = await request(app)
        .post('/api/budget')
        .send(budgetData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.accountId).toBe('test');
      expect(response.body.data.service).toBe('ec2');
      expect(response.body.data.amount).toBe(1000);
      expect(response.body.message).toBe('Budget saved successfully');
    });

    it('should update existing budget', async () => {
      const originalBudget = budgetService.saveBudget({
        accountId: 'test',
        service: 'ec2',
        amount: 1000,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      });

      const updatedData = {
        accountId: 'test',
        service: 'ec2',
        amount: 1500,
        currency: 'USD',
        period: 'quarterly',
        alertThresholds: [60, 85, 100]
      };

      const response = await request(app)
        .post('/api/budget')
        .send(updatedData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(originalBudget.id);
      expect(response.body.data.amount).toBe(1500);
      expect(response.body.data.period).toBe('quarterly');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        accountId: 'test',
        // missing amount, currency, period
      };

      const response = await request(app)
        .post('/api/budget')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should set default alert thresholds if not provided', async () => {
      const budgetData = {
        accountId: 'test',
        service: 'ec2',
        amount: 1000,
        currency: 'USD',
        period: 'monthly'
        // alertThresholds not provided
      };

      const response = await request(app)
        .post('/api/budget')
        .send(budgetData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.alertThresholds).toEqual([50, 80, 100]);
    });
  });

  describe('DELETE /api/budget/:budgetId', () => {
    it('should delete a budget', async () => {
      const budget = budgetService.saveBudget({
        accountId: 'test',
        service: 'ec2',
        amount: 1000,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      });

      const response = await request(app)
        .delete(`/api/budget/${budget.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Budget deleted successfully');

      // Verify budget is deleted
      const budgets = budgetService.getBudgets('test');
      expect(budgets).toHaveLength(0);
    });

    it('should return 404 for non-existent budget', async () => {
      const response = await request(app)
        .delete('/api/budget/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Budget not found');
    });
  });

  describe('GET /api/budget/:accountId/notifications', () => {
    it('should get notifications for an account', async () => {
      // Create budget and generate alerts
      budgetService.saveBudget({
        accountId: 'test',
        service: 'ec2',
        amount: 1000,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      });

      const utilizations = [
        {
          service: 'ec2',
          currentCost: 1200,
          budgetAmount: 1000,
          utilizationPercentage: 120,
          alertLevel: 'over_budget' as const
        }
      ];

      budgetService.generateAlerts(utilizations);

      const response = await request(app)
        .get('/api/budget/test/notifications')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('service', 'ec2');
      expect(response.body.data[0]).toHaveProperty('severity', 'critical');
    });
  });

  describe('PATCH /api/budget/notifications/:notificationId/acknowledge', () => {
    it('should acknowledge a notification', async () => {
      // Create budget and generate alert
      budgetService.saveBudget({
        accountId: 'test',
        service: 'ec2',
        amount: 1000,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      });

      const utilizations = [
        {
          service: 'ec2',
          currentCost: 1200,
          budgetAmount: 1000,
          utilizationPercentage: 120,
          alertLevel: 'over_budget' as const
        }
      ];

      const alerts = budgetService.generateAlerts(utilizations);
      const notificationId = alerts[0].id;

      const response = await request(app)
        .patch(`/api/budget/notifications/${notificationId}/acknowledge`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Notification acknowledged');

      // Verify notification is acknowledged
      const notifications = budgetService.getNotifications('test');
      expect(notifications[0].acknowledged).toBe(true);
    });

    it('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .patch('/api/budget/notifications/nonexistent/acknowledge')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Notification not found');
    });
  });

  describe('POST /api/budget/demo/initialize', () => {
    it('should initialize demo budgets', async () => {
      const response = await request(app)
        .post('/api/budget/demo/initialize')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Demo budgets initialized');

      // Verify demo budgets were created
      const demoBudgets = budgetService.getBudgets('demo');
      expect(demoBudgets.length).toBeGreaterThan(0);
    });
  });
});