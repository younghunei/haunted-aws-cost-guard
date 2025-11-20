import { Budget, BudgetUtilization, BudgetNotification, ServiceCost } from '../types';

export class BudgetService {
  private budgets: Map<string, Budget> = new Map();
  private notifications: BudgetNotification[] = [];

  // Get all budgets for an account
  public getBudgets(accountId: string): Budget[] {
    return Array.from(this.budgets.values())
      .filter(budget => budget.accountId === accountId);
  }

  // Get budget for a specific service
  public getBudgetByService(accountId: string, service: string): Budget | null {
    return Array.from(this.budgets.values())
      .find(budget => budget.accountId === accountId && budget.service === service) || null;
  }

  // Create or update a budget
  public saveBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Budget {
    const existingBudget = Array.from(this.budgets.values())
      .find(b => b.accountId === budget.accountId && b.service === budget.service);

    if (existingBudget) {
      // Update existing budget
      const updatedBudget: Budget = {
        ...existingBudget,
        ...budget,
        updatedAt: new Date()
      };
      this.budgets.set(updatedBudget.id, updatedBudget);
      return updatedBudget;
    } else {
      // Create new budget
      const newBudget: Budget = {
        ...budget,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.budgets.set(newBudget.id, newBudget);
      return newBudget;
    }
  }

  // Delete a budget
  public deleteBudget(budgetId: string): boolean {
    return this.budgets.delete(budgetId);
  }

  // Calculate budget utilization for services
  public calculateUtilization(services: ServiceCost[], accountId: string): BudgetUtilization[] {
    const budgets = this.getBudgets(accountId);
    const utilizations: BudgetUtilization[] = [];

    for (const service of services) {
      const budget = budgets.find(b => b.service === service.service);
      
      if (budget) {
        const utilizationPercentage = (service.totalCost / budget.amount) * 100;
        const alertLevel = this.determineAlertLevel(utilizationPercentage, budget.alertThresholds);
        
        utilizations.push({
          service: service.service,
          currentCost: service.totalCost,
          budgetAmount: budget.amount,
          utilizationPercentage,
          alertLevel,
          projectedCost: this.calculateProjectedCost(service)
        });
      } else {
        // No budget set - use default thresholds
        utilizations.push({
          service: service.service,
          currentCost: service.totalCost,
          budgetAmount: 0,
          utilizationPercentage: 0,
          alertLevel: 'safe'
        });
      }
    }

    return utilizations;
  }

  // Generate budget alerts based on current utilization
  public generateAlerts(utilizations: BudgetUtilization[]): BudgetNotification[] {
    const alerts: BudgetNotification[] = [];

    for (const utilization of utilizations) {
      if (utilization.alertLevel !== 'safe') {
        const budget = Array.from(this.budgets.values())
          .find(b => b.service === utilization.service);

        if (budget) {
          const message = this.generateAlertMessage(utilization);
          const severity = utilization.alertLevel === 'critical' || utilization.alertLevel === 'over_budget' 
            ? 'critical' : 'warning';

          alerts.push({
            id: this.generateId(),
            budgetId: budget.id,
            service: utilization.service,
            message,
            severity,
            timestamp: new Date(),
            acknowledged: false
          });
        }
      }
    }

    // Store new notifications
    this.notifications.push(...alerts);
    return alerts;
  }

  // Get notifications for an account
  public getNotifications(accountId: string): BudgetNotification[] {
    const budgets = this.getBudgets(accountId);
    const budgetIds = budgets.map(b => b.id);
    
    return this.notifications.filter(notification => 
      budgetIds.includes(notification.budgetId)
    );
  }

  // Acknowledge a notification
  public acknowledgeNotification(notificationId: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.acknowledged = true;
      return true;
    }
    return false;
  }

  // Initialize with demo budgets
  public initializeDemoBudgets(): void {
    // Clear existing demo budgets first
    const existingBudgets = this.getBudgets('demo');
    existingBudgets.forEach(budget => this.deleteBudget(budget.id));
    
    const demoBudgets: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        accountId: 'demo',
        service: 'ec2',
        amount: 1500,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      },
      {
        accountId: 'demo',
        service: 's3',
        amount: 1000,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      },
      {
        accountId: 'demo',
        service: 'rds',
        amount: 1200,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      },
      {
        accountId: 'demo',
        service: 'lambda',
        amount: 600,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      },
      {
        accountId: 'demo',
        service: 'cloudfront',
        amount: 1500,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      },
      {
        accountId: 'demo',
        service: 'dynamodb',
        amount: 800,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      }
    ];

    demoBudgets.forEach(budget => this.saveBudget(budget));
  }

  private determineAlertLevel(utilizationPercentage: number, thresholds: number[]): 'safe' | 'warning' | 'critical' | 'over_budget' {
    if (utilizationPercentage >= 100) return 'over_budget';
    if (utilizationPercentage >= (thresholds[2] || 100)) return 'critical';
    if (utilizationPercentage >= (thresholds[1] || 80)) return 'warning';
    if (utilizationPercentage >= (thresholds[0] || 50)) return 'warning';
    return 'safe';
  }

  private calculateProjectedCost(service: ServiceCost): number {
    // Simple projection based on trend
    const currentCost = service.totalCost;
    const dailyCosts = service.dailyCosts;
    
    if (dailyCosts.length < 2) return currentCost;
    
    // Calculate average daily growth
    const recentCosts = dailyCosts.slice(-7); // Last 7 days
    const avgDailyGrowth = recentCosts.reduce((sum, cost, index) => {
      if (index === 0) return 0;
      return sum + (cost.cost - recentCosts[index - 1].cost);
    }, 0) / (recentCosts.length - 1);

    // Project for rest of month (assuming 30 days)
    const daysRemaining = 30 - dailyCosts.length;
    return currentCost + (avgDailyGrowth * daysRemaining);
  }

  private generateAlertMessage(utilization: BudgetUtilization): string {
    const percentage = Math.round(utilization.utilizationPercentage);
    const service = utilization.service.toUpperCase();
    
    if (utilization.alertLevel === 'over_budget') {
      return `🚨 ${service} has exceeded budget by ${percentage - 100}% ($${utilization.currentCost.toFixed(2)} / $${utilization.budgetAmount.toFixed(2)})`;
    } else if (utilization.alertLevel === 'critical') {
      return `⚠️ ${service} is at ${percentage}% of budget ($${utilization.currentCost.toFixed(2)} / $${utilization.budgetAmount.toFixed(2)})`;
    } else {
      return `📊 ${service} is at ${percentage}% of budget ($${utilization.currentCost.toFixed(2)} / $${utilization.budgetAmount.toFixed(2)})`;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

// Singleton instance
export const budgetService = new BudgetService();