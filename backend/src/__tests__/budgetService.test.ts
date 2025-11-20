import { budgetService } from '../services/budgetService';
import { Budget, ServiceCost } from '../types';

describe('BudgetService', () => {
  beforeEach(() => {
    // Clear all budgets before each test
    const budgets = budgetService.getBudgets('test');
    budgets.forEach(budget => budgetService.deleteBudget(budget.id));
  });

  describe('Budget Management', () => {
    it('should create a new budget', () => {
      const budgetData = {
        accountId: 'test',
        service: 'ec2',
        amount: 1000,
        currency: 'USD',
        period: 'monthly' as const,
        alertThresholds: [50, 80, 100]
      };

      const budget = budgetService.saveBudget(budgetData);

      expect(budget.id).toBeDefined();
      expect(budget.accountId).toBe('test');
      expect(budget.service).toBe('ec2');
      expect(budget.amount).toBe(1000);
      expect(budget.currency).toBe('USD');
      expect(budget.period).toBe('monthly');
      expect(budget.alertThresholds).toEqual([50, 80, 100]);
      expect(budget.createdAt).toBeInstanceOf(Date);
      expect(budget.updatedAt).toBeInstanceOf(Date);
    });

    it('should update an existing budget', async () => {
      const budgetData = {
        accountId: 'test',
        service: 'ec2',
        amount: 1000,
        currency: 'USD',
        period: 'monthly' as const,
        alertThresholds: [50, 80, 100]
      };

      const originalBudget = budgetService.saveBudget(budgetData);
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Update the budget
      const updatedData = {
        ...budgetData,
        amount: 1500,
        alertThresholds: [60, 85, 100]
      };

      const updatedBudget = budgetService.saveBudget(updatedData);

      expect(updatedBudget.id).toBe(originalBudget.id);
      expect(updatedBudget.amount).toBe(1500);
      expect(updatedBudget.alertThresholds).toEqual([60, 85, 100]);
      expect(updatedBudget.updatedAt.getTime()).toBeGreaterThan(originalBudget.updatedAt.getTime());
    });

    it('should get budgets by account ID', () => {
      const budget1 = budgetService.saveBudget({
        accountId: 'test1',
        service: 'ec2',
        amount: 1000,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      });

      const budget2 = budgetService.saveBudget({
        accountId: 'test1',
        service: 's3',
        amount: 500,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      });

      const budget3 = budgetService.saveBudget({
        accountId: 'test2',
        service: 'ec2',
        amount: 2000,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      });

      const test1Budgets = budgetService.getBudgets('test1');
      const test2Budgets = budgetService.getBudgets('test2');

      expect(test1Budgets).toHaveLength(2);
      expect(test2Budgets).toHaveLength(1);
      expect(test1Budgets.map(b => b.id)).toContain(budget1.id);
      expect(test1Budgets.map(b => b.id)).toContain(budget2.id);
      expect(test2Budgets[0].id).toBe(budget3.id);
    });

    it('should get budget by service', () => {
      const budget = budgetService.saveBudget({
        accountId: 'test',
        service: 'ec2',
        amount: 1000,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      });

      const foundBudget = budgetService.getBudgetByService('test', 'ec2');
      const notFoundBudget = budgetService.getBudgetByService('test', 's3');

      expect(foundBudget).toBeTruthy();
      expect(foundBudget?.id).toBe(budget.id);
      expect(notFoundBudget).toBeNull();
    });

    it('should delete a budget', () => {
      const budget = budgetService.saveBudget({
        accountId: 'test',
        service: 'ec2',
        amount: 1000,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      });

      const deleted = budgetService.deleteBudget(budget.id);
      const budgets = budgetService.getBudgets('test');

      expect(deleted).toBe(true);
      expect(budgets).toHaveLength(0);
    });
  });

  describe('Budget Utilization Calculation', () => {
    it('should calculate utilization correctly', () => {
      // Create budgets
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

      // Mock service costs
      const services: ServiceCost[] = [
        {
          service: 'ec2',
          displayName: 'EC2',
          totalCost: 750, // 75% of budget
          currency: 'USD',
          budgetUtilization: 0.75,
          regions: [],
          tags: [],
          dailyCosts: [
            { date: '2024-11-18', cost: 750 }
          ],
          trend: 'stable'
        },
        {
          service: 's3',
          displayName: 'S3',
          totalCost: 600, // 120% of budget (over budget)
          currency: 'USD',
          budgetUtilization: 1.2,
          regions: [],
          tags: [],
          dailyCosts: [
            { date: '2024-11-18', cost: 600 }
          ],
          trend: 'increasing'
        }
      ];

      const utilizations = budgetService.calculateUtilization(services, 'test');

      expect(utilizations).toHaveLength(2);

      const ec2Utilization = utilizations.find(u => u.service === 'ec2');
      const s3Utilization = utilizations.find(u => u.service === 's3');

      expect(ec2Utilization).toBeTruthy();
      expect(ec2Utilization?.utilizationPercentage).toBe(75);
      expect(ec2Utilization?.alertLevel).toBe('warning'); // 75% is between 50% and 80%

      expect(s3Utilization).toBeTruthy();
      expect(s3Utilization?.utilizationPercentage).toBe(120);
      expect(s3Utilization?.alertLevel).toBe('over_budget'); // 120% is over 100%
    });

    it('should handle services without budgets', () => {
      const services: ServiceCost[] = [
        {
          service: 'lambda',
          displayName: 'Lambda',
          totalCost: 100,
          currency: 'USD',
          budgetUtilization: 0,
          regions: [],
          tags: [],
          dailyCosts: [],
          trend: 'stable'
        }
      ];

      const utilizations = budgetService.calculateUtilization(services, 'test');

      expect(utilizations).toHaveLength(1);
      expect(utilizations[0].budgetAmount).toBe(0);
      expect(utilizations[0].utilizationPercentage).toBe(0);
      expect(utilizations[0].alertLevel).toBe('safe');
    });
  });

  describe('Alert Generation', () => {
    it('should generate alerts for budget overruns', () => {
      // Create budget
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

      expect(alerts).toHaveLength(1);
      expect(alerts[0].service).toBe('ec2');
      expect(alerts[0].severity).toBe('critical');
      expect(alerts[0].message).toContain('exceeded budget');
      expect(alerts[0].acknowledged).toBe(false);
    });

    it('should generate warning alerts', () => {
      budgetService.saveBudget({
        accountId: 'test',
        service: 's3',
        amount: 500,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      });

      const utilizations = [
        {
          service: 's3',
          currentCost: 400,
          budgetAmount: 500,
          utilizationPercentage: 80,
          alertLevel: 'warning' as const
        }
      ];

      const alerts = budgetService.generateAlerts(utilizations);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('warning');
      expect(alerts[0].message).toContain('80%');
    });

    it('should not generate alerts for safe utilization', () => {
      budgetService.saveBudget({
        accountId: 'test',
        service: 'lambda',
        amount: 200,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      });

      const utilizations = [
        {
          service: 'lambda',
          currentCost: 50,
          budgetAmount: 200,
          utilizationPercentage: 25,
          alertLevel: 'safe' as const
        }
      ];

      const alerts = budgetService.generateAlerts(utilizations);

      expect(alerts).toHaveLength(0);
    });
  });

  describe('Notification Management', () => {
    it('should acknowledge notifications', () => {
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
      expect(alerts).toHaveLength(1);
      
      const notificationId = alerts[0].id;
      const acknowledged = budgetService.acknowledgeNotification(notificationId);
      const notifications = budgetService.getNotifications('test');

      expect(acknowledged).toBe(true);
      expect(notifications).toHaveLength(1);
      expect(notifications[0].acknowledged).toBe(true);
    });
  });

  describe('Demo Data Initialization', () => {
    it('should initialize demo budgets', () => {
      budgetService.initializeDemoBudgets();
      const demoBudgets = budgetService.getBudgets('demo');

      expect(demoBudgets.length).toBeGreaterThan(0);
      expect(demoBudgets.some(b => b.service === 'ec2')).toBe(true);
      expect(demoBudgets.some(b => b.service === 's3')).toBe(true);
      expect(demoBudgets.some(b => b.service === 'rds')).toBe(true);
    });
  });
});