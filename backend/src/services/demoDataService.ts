import { ServiceCost, CostData, BudgetAlert } from '../types';
import { budgetService } from './budgetService';

export class DemoDataService {
  private generateDemoServices(): ServiceCost[] {
    return [
      {
        service: 'ec2',
        displayName: 'EC2',
        totalCost: 1250,
        currency: 'USD',
        budgetUtilization: 0.85,
        regions: [
          { region: 'us-east-1', cost: 500, percentage: 40 },
          { region: 'us-west-2', cost: 375, percentage: 30 },
          { region: 'eu-west-1', cost: 250, percentage: 20 },
          { region: 'ap-northeast-1', cost: 125, percentage: 10 }
        ],
        tags: [
          { key: 'Environment', value: 'Production', cost: 750, percentage: 60 },
          { key: 'Environment', value: 'Staging', cost: 375, percentage: 30 },
          { key: 'Environment', value: 'Development', cost: 125, percentage: 10 }
        ],
        dailyCosts: [
          { date: '2024-11-12', cost: 120 },
          { date: '2024-11-13', cost: 135 },
          { date: '2024-11-14', cost: 98 },
          { date: '2024-11-15', cost: 156 },
          { date: '2024-11-16', cost: 189 },
          { date: '2024-11-17', cost: 234 },
          { date: '2024-11-18', cost: 318 }
        ],
        trend: 'increasing'
      },
      {
        service: 's3',
        displayName: 'S3',
        totalCost: 340,
        currency: 'USD',
        budgetUtilization: 0.34,
        regions: [
          { region: 'us-east-1', cost: 136, percentage: 40 },
          { region: 'us-west-2', cost: 102, percentage: 30 },
          { region: 'eu-west-1', cost: 68, percentage: 20 },
          { region: 'ap-northeast-1', cost: 34, percentage: 10 }
        ],
        tags: [
          { key: 'DataType', value: 'Media', cost: 170, percentage: 50 },
          { key: 'DataType', value: 'Backup', cost: 102, percentage: 30 },
          { key: 'DataType', value: 'Logs', cost: 68, percentage: 20 }
        ],
        dailyCosts: [
          { date: '2024-11-12', cost: 45 },
          { date: '2024-11-13', cost: 48 },
          { date: '2024-11-14', cost: 52 },
          { date: '2024-11-15', cost: 49 },
          { date: '2024-11-16', cost: 51 },
          { date: '2024-11-17', cost: 47 },
          { date: '2024-11-18', cost: 48 }
        ],
        trend: 'stable'
      },
      {
        service: 'rds',
        displayName: 'RDS',
        totalCost: 890,
        currency: 'USD',
        budgetUtilization: 0.67,
        regions: [
          { region: 'us-east-1', cost: 356, percentage: 40 },
          { region: 'us-west-2', cost: 267, percentage: 30 },
          { region: 'eu-west-1', cost: 178, percentage: 20 },
          { region: 'ap-northeast-1', cost: 89, percentage: 10 }
        ],
        tags: [
          { key: 'Application', value: 'WebApp', cost: 445, percentage: 50 },
          { key: 'Application', value: 'Analytics', cost: 267, percentage: 30 },
          { key: 'Application', value: 'Reporting', cost: 178, percentage: 20 }
        ],
        dailyCosts: [
          { date: '2024-11-12', cost: 125 },
          { date: '2024-11-13', cost: 118 },
          { date: '2024-11-14', cost: 132 },
          { date: '2024-11-15', cost: 128 },
          { date: '2024-11-16', cost: 135 },
          { date: '2024-11-17', cost: 142 },
          { date: '2024-11-18', cost: 110 }
        ],
        trend: 'increasing'
      },
      {
        service: 'lambda',
        displayName: 'Lambda',
        totalCost: 156,
        currency: 'USD',
        budgetUtilization: 0.26,
        regions: [
          { region: 'us-east-1', cost: 62, percentage: 40 },
          { region: 'us-west-2', cost: 47, percentage: 30 },
          { region: 'eu-west-1', cost: 31, percentage: 20 },
          { region: 'ap-northeast-1', cost: 16, percentage: 10 }
        ],
        tags: [
          { key: 'Function', value: 'API', cost: 78, percentage: 50 },
          { key: 'Function', value: 'Processing', cost: 47, percentage: 30 },
          { key: 'Function', value: 'Triggers', cost: 31, percentage: 20 }
        ],
        dailyCosts: [
          { date: '2024-11-12', cost: 18 },
          { date: '2024-11-13', cost: 22 },
          { date: '2024-11-14', cost: 19 },
          { date: '2024-11-15', cost: 25 },
          { date: '2024-11-16', cost: 21 },
          { date: '2024-11-17', cost: 23 },
          { date: '2024-11-18', cost: 28 }
        ],
        trend: 'stable'
      },
      {
        service: 'cloudfront',
        displayName: 'CloudFront',
        totalCost: 2100,
        currency: 'USD',
        budgetUtilization: 1.4, // Over budget!
        regions: [], // CloudFront는 글로벌 서비스이므로 리전별 데이터 없음
        tags: [
          { key: 'Content', value: 'Static', cost: 1050, percentage: 50 },
          { key: 'Content', value: 'Dynamic', cost: 630, percentage: 30 },
          { key: 'Content', value: 'Streaming', cost: 420, percentage: 20 }
        ],
        dailyCosts: [
          { date: '2024-11-12', cost: 280 },
          { date: '2024-11-13', cost: 295 },
          { date: '2024-11-14', cost: 310 },
          { date: '2024-11-15', cost: 325 },
          { date: '2024-11-16', cost: 340 },
          { date: '2024-11-17', cost: 365 },
          { date: '2024-11-18', cost: 185 }
        ],
        trend: 'increasing'
      },
      {
        service: 'route53',
        displayName: 'Route 53',
        totalCost: 45,
        currency: 'USD',
        budgetUtilization: 0.15,
        regions: [], // Route 53은 글로벌 서비스
        tags: [
          { key: 'Domain', value: 'Production', cost: 27, percentage: 60 },
          { key: 'Domain', value: 'Staging', cost: 13.5, percentage: 30 },
          { key: 'Domain', value: 'Development', cost: 4.5, percentage: 10 }
        ],
        dailyCosts: [
          { date: '2024-11-12', cost: 6.2 },
          { date: '2024-11-13', cost: 6.5 },
          { date: '2024-11-14', cost: 6.1 },
          { date: '2024-11-15', cost: 6.8 },
          { date: '2024-11-16', cost: 6.4 },
          { date: '2024-11-17', cost: 6.7 },
          { date: '2024-11-18', cost: 6.3 }
        ],
        trend: 'stable'
      },
      {
        service: 'iam',
        displayName: 'IAM',
        totalCost: 0,
        currency: 'USD',
        budgetUtilization: 0,
        regions: [], // IAM은 글로벌 서비스이며 무료
        tags: [],
        dailyCosts: [
          { date: '2024-11-12', cost: 0 },
          { date: '2024-11-13', cost: 0 },
          { date: '2024-11-14', cost: 0 },
          { date: '2024-11-15', cost: 0 },
          { date: '2024-11-16', cost: 0 },
          { date: '2024-11-17', cost: 0 },
          { date: '2024-11-18', cost: 0 }
        ],
        trend: 'stable'
      },
      {
        service: 'vpc',
        displayName: 'VPC',
        totalCost: 234,
        currency: 'USD',
        budgetUtilization: 0.39,
        regions: [
          { region: 'us-east-1', cost: 93.6, percentage: 40 },
          { region: 'us-west-2', cost: 70.2, percentage: 30 },
          { region: 'eu-west-1', cost: 46.8, percentage: 20 },
          { region: 'ap-northeast-1', cost: 23.4, percentage: 10 }
        ],
        tags: [
          { key: 'Environment', value: 'Production', cost: 140.4, percentage: 60 },
          { key: 'Environment', value: 'Staging', cost: 70.2, percentage: 30 },
          { key: 'Environment', value: 'Development', cost: 23.4, percentage: 10 }
        ],
        dailyCosts: [
          { date: '2024-11-12', cost: 32 },
          { date: '2024-11-13', cost: 35 },
          { date: '2024-11-14', cost: 31 },
          { date: '2024-11-15', cost: 38 },
          { date: '2024-11-16', cost: 34 },
          { date: '2024-11-17', cost: 36 },
          { date: '2024-11-18', cost: 28 }
        ],
        trend: 'stable'
      }
    ];
  }

  private generateBudgetAlerts(services: ServiceCost[]): BudgetAlert[] {
    return services
      .filter(service => service.budgetUtilization > 0.8)
      .map(service => ({
        service: service.service,
        currentCost: service.totalCost,
        budgetLimit: service.totalCost / service.budgetUtilization,
        utilizationPercentage: service.budgetUtilization * 100,
        severity: service.budgetUtilization > 1.0 ? 'critical' : 'warning'
      }));
  }

  public getDemoData(): CostData {
    const services = this.generateDemoServices();
    const totalCost = services.reduce((sum, service) => sum + service.totalCost, 0);
    const budgetAlerts = this.generateBudgetAlerts(services);

    // Generate budget utilizations and alerts
    const utilizations = budgetService.calculateUtilization(services, 'demo');
    budgetService.generateAlerts(utilizations);

    return {
      services,
      totalCost,
      currency: 'USD',
      lastUpdated: new Date(),
      budgetAlerts
    };
  }

  public getDemoScenarios() {
    return [
      {
        id: 'normal_usage',
        name: 'Normal Usage',
        description: 'All services within budget, normal operation'
      },
      {
        id: 'budget_warning',
        name: 'Budget Warning',
        description: 'Some services approaching budget limits'
      },
      {
        id: 'cost_spike',
        name: 'Cost Spike',
        description: 'Multiple services over budget, immediate attention required'
      }
    ];
  }
}