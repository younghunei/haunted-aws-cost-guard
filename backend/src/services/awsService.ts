import { 
  CostExplorerClient, 
  GetCostAndUsageCommand,
  GetDimensionValuesCommand,
  GetCostAndUsageCommandOutput
} from '@aws-sdk/client-cost-explorer';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { BudgetsClient, DescribeBudgetsCommand } from '@aws-sdk/client-budgets';
import NodeCache from 'node-cache';
import { 
  AWSCredentials, 
  CostData, 
  ServiceCost, 
  CostExplorerParams,
  AWSCostResponse,
  CostCacheEntry,
  RegionCost,
  TagCost,
  DailyCost
} from '../types';

export class AWSService {
  private costExplorerClient: CostExplorerClient | null = null;
  private stsClient: STSClient | null = null;
  private budgetsClient: BudgetsClient | null = null;
  private cache: NodeCache;
  private credentials: AWSCredentials | null = null;

  constructor() {
    // Initialize cache with 15 minute TTL for cost data
    this.cache = new NodeCache({ 
      stdTTL: 900, // 15 minutes
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false
    });
  }

  public async validateCredentials(credentials: AWSCredentials): Promise<boolean> {
    try {
      const region = credentials.region || 'us-east-1';
      
      // Initialize STS client for credential validation
      this.stsClient = new STSClient({
        region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey
        }
      });

      // Test credentials by getting caller identity
      const command = new GetCallerIdentityCommand({});
      const identity = await this.stsClient.send(command);
      
      // Initialize Cost Explorer client (must be in us-east-1)
      this.costExplorerClient = new CostExplorerClient({
        region: 'us-east-1',
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey
        }
      });

      // Initialize Budgets client
      this.budgetsClient = new BudgetsClient({
        region: 'us-east-1',
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey
        }
      });

      // Test Cost Explorer access with a simple query
      try {
        const testCommand = new GetCostAndUsageCommand({
          TimePeriod: {
            Start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            End: new Date().toISOString().split('T')[0]
          },
          Granularity: 'DAILY',
          Metrics: ['BlendedCost']
        });
        await this.costExplorerClient.send(testCommand);
      } catch (costError: any) {
        if (costError.name === 'AccessDeniedException') {
          console.warn('Cost Explorer access denied. This account may be a member account in AWS Organizations or lacks Cost Explorer permissions.');
          // Still allow validation to pass, but log the limitation
        } else {
          throw costError;
        }
      }

      this.credentials = credentials;
      console.log(`AWS credentials validated for account: ${identity.Account}`);
      return true;
    } catch (error) {
      console.error('AWS credential validation failed:', error);
      this.costExplorerClient = null;
      this.stsClient = null;
      this.budgetsClient = null;
      this.credentials = null;
      return false;
    }
  }

  public async getCostData(timeRange?: { start: Date; end: Date }): Promise<CostData> {
    if (!this.costExplorerClient) {
      throw new Error('AWS credentials not validated. Please validate credentials first.');
    }

    // Check cache first
    const cacheKey = `cost-data-${timeRange?.start?.toISOString() || 'default'}-${timeRange?.end?.toISOString() || 'default'}`;
    const cachedData = this.cache.get<CostData>(cacheKey);
    
    if (cachedData) {
      console.log('Returning cached cost data');
      return cachedData;
    }

    try {
      const endDate = timeRange?.end || new Date();
      const startDate = timeRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

      // Get cost data grouped by service
      const serviceCostData = await this.getCostByService(startDate, endDate);
      
      // Get regional breakdown
      const regionalData = await this.getCostByRegion(startDate, endDate);
      
      // Get daily costs for trend analysis
      const dailyCostData = await this.getDailyCosts(startDate, endDate);

      // Transform and combine data
      const services = await this.transformToServiceCosts(serviceCostData, regionalData, dailyCostData);
      const totalCost = services.reduce((sum, service) => sum + service.totalCost, 0);

      const costData: CostData = {
        services,
        totalCost,
        currency: 'USD',
        lastUpdated: new Date(),
        budgetAlerts: [] // Will be populated by budget service
      };

      // Cache the result
      this.cache.set(cacheKey, costData);
      
      return costData;
    } catch (error: any) {
      console.error('Failed to fetch AWS cost data:', error);
      
      // Handle specific AWS permission errors
      if (error.name === 'AccessDeniedException') {
        if (error.message?.includes('Payer account') && error.message?.includes('linked account')) {
          throw new Error('This AWS account is a member account in an AWS Organization and does not have Cost Explorer access. Please use the master/payer account or request Cost Explorer permissions from your organization administrator.');
        } else {
          throw new Error('Access denied to AWS Cost Explorer. Please check your IAM permissions for Cost Explorer access.');
        }
      }
      
      // Implement retry logic with exponential backoff for retryable errors
      if (this.shouldRetry(error)) {
        console.log('Retrying cost data fetch...');
        await this.delay(1000); // Wait 1 second before retry
        return this.getCostData(timeRange);
      }
      
      throw new Error(`Failed to retrieve cost data from AWS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getCostByService(startDate: Date, endDate: Date): Promise<GetCostAndUsageCommandOutput> {
    const command = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: startDate.toISOString().split('T')[0],
        End: endDate.toISOString().split('T')[0]
      },
      Granularity: 'MONTHLY',
      Metrics: ['BlendedCost', 'UnblendedCost', 'UsageQuantity'],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'SERVICE'
        }
      ]
    });

    return await this.costExplorerClient!.send(command);
  }

  private async getCostByRegion(startDate: Date, endDate: Date): Promise<GetCostAndUsageCommandOutput> {
    const command = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: startDate.toISOString().split('T')[0],
        End: endDate.toISOString().split('T')[0]
      },
      Granularity: 'MONTHLY',
      Metrics: ['BlendedCost'],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'REGION'
        },
        {
          Type: 'DIMENSION',
          Key: 'SERVICE'
        }
      ]
    });

    return await this.costExplorerClient!.send(command);
  }

  private async getDailyCosts(startDate: Date, endDate: Date): Promise<GetCostAndUsageCommandOutput> {
    const command = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: startDate.toISOString().split('T')[0],
        End: endDate.toISOString().split('T')[0]
      },
      Granularity: 'DAILY',
      Metrics: ['BlendedCost'],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'SERVICE'
        }
      ]
    });

    return await this.costExplorerClient!.send(command);
  }

  private async transformToServiceCosts(
    serviceCostData: GetCostAndUsageCommandOutput,
    regionalData: GetCostAndUsageCommandOutput,
    dailyCostData: GetCostAndUsageCommandOutput
  ): Promise<ServiceCost[]> {
    const serviceMap = new Map<string, ServiceCost>();

    // Process main service cost data
    if (serviceCostData.ResultsByTime) {
      for (const timeResult of serviceCostData.ResultsByTime) {
        if (timeResult.Groups) {
          for (const group of timeResult.Groups) {
            const serviceName = group.Keys?.[0] || 'Unknown';
            const cost = parseFloat(group.Metrics?.['BlendedCost']?.Amount || '0');
            
            if (!serviceMap.has(serviceName)) {
              serviceMap.set(serviceName, {
                service: this.normalizeServiceName(serviceName),
                displayName: serviceName,
                totalCost: 0,
                currency: 'USD',
                budgetUtilization: 0, // Will be calculated by budget service
                regions: [],
                tags: [],
                dailyCosts: [],
                trend: 'stable'
              });
            }
            
            const service = serviceMap.get(serviceName)!;
            service.totalCost += cost;
          }
        }
      }
    }

    // Add regional breakdown
    this.addRegionalBreakdown(serviceMap, regionalData);
    
    // Add daily costs and calculate trends
    this.addDailyCostsAndTrends(serviceMap, dailyCostData);

    return Array.from(serviceMap.values()).filter(service => service.totalCost > 0);
  }

  private addRegionalBreakdown(serviceMap: Map<string, ServiceCost>, regionalData: GetCostAndUsageCommandOutput): void {
    if (!regionalData.ResultsByTime) return;

    const regionMap = new Map<string, Map<string, number>>();
    
    // 글로벌 서비스 목록 (리전별 분석이 의미없는 서비스들)
    const globalServices = new Set([
      // 네트워킹 & 콘텐츠 전송
      'Amazon CloudFront',
      'Amazon Route 53',
      'AWS Global Accelerator',
      'AWS Direct Connect',
      
      // 보안 & 자격 증명
      'AWS Identity and Access Management',
      'AWS Certificate Manager',
      'AWS WAF',
      'AWS Shield',
      'AWS Single Sign-On',
      'AWS Secrets Manager',
      'AWS Key Management Service',
      
      // 관리 & 거버넌스
      'AWS Organizations',
      'AWS Control Tower',
      'AWS Config',
      'AWS CloudTrail',
      'AWS Trusted Advisor',
      'AWS Personal Health Dashboard',
      'AWS Systems Manager',
      'AWS CloudFormation',
      
      // Cost Management
      'AWS Billing',
      'AWS Cost and Usage Report',
      'AWS Budgets',
      'AWS Cost Explorer',
      'AWS Cost Anomaly Detection',
      'Tax',
      
      // 지원 서비스
      'AWS Support (Business)',
      'AWS Support (Developer)',
      'AWS Support (Enterprise)',
      'AWS Support (Basic)',
      'AWS Premium Support',
      
      // 기타 글로벌 서비스
      'AWS Marketplace',
      'AWS Partner Network',
      'Amazon Chime',
      'Amazon WorkDocs',
      'Amazon WorkMail',
      'AWS Artifact',
      'AWS IQ',
      'AWS re:Post',
      
      // 데이터베이스 글로벌 기능
      'Amazon DynamoDB Global Tables',
      'Amazon Aurora Global Database',
      
      // 분석 글로벌 서비스
      'Amazon QuickSight',
      'AWS Data Exchange'
    ]);

    for (const timeResult of regionalData.ResultsByTime) {
      if (timeResult.Groups) {
        for (const group of timeResult.Groups) {
          const [region, serviceName] = group.Keys || [];
          const cost = parseFloat(group.Metrics?.['BlendedCost']?.Amount || '0');
          
          if (serviceName && region && cost > 0) {
            // 글로벌 서비스는 리전별 분석에서 제외
            if (globalServices.has(serviceName)) {
              continue;
            }
            
            // 리전이 아닌 값들 필터링 (더 포괄적)
            const invalidRegions = [
              'no region', 'global', 'noregion', 'worldwide', 'all regions',
              'multiple regions', 'cross-region', 'inter-region', 'any region',
              'not applicable', 'n/a', 'none', 'unknown', 'unspecified',
              '', ' ', 'null', 'undefined'
            ];
            
            if (!region || 
                invalidRegions.includes(region.toLowerCase().trim()) ||
                region.trim() === '' ||
                region.length < 2) {
              continue;
            }
            
            // AWS 리전 형식 검증 (예: us-east-1, eu-west-1, us-gov-east-1, cn-north-1 등)
            const regionPattern = /^(us-gov-|cn-)?[a-z]{2,3}-[a-z]+-\d+$/;
            if (!regionPattern.test(region.toLowerCase())) {
              continue;
            }
            
            if (!regionMap.has(serviceName)) {
              regionMap.set(serviceName, new Map());
            }
            
            const serviceRegions = regionMap.get(serviceName)!;
            const currentCost = serviceRegions.get(region) || 0;
            serviceRegions.set(region, currentCost + cost);
          }
        }
      }
    }

    // Update service objects with regional data
    for (const [serviceName, regions] of regionMap) {
      const service = serviceMap.get(serviceName);
      if (service && regions.size > 0) {
        const totalServiceCost = service.totalCost;
        service.regions = Array.from(regions.entries())
          .map(([region, cost]) => ({
            region,
            cost,
            percentage: totalServiceCost > 0 ? (cost / totalServiceCost) * 100 : 0
          }))
          .filter(regionData => regionData.cost > 0.01) // 1센트 이상인 것만
          .sort((a, b) => b.cost - a.cost); // Sort by cost
      }
    }
  }

  private addDailyCostsAndTrends(serviceMap: Map<string, ServiceCost>, dailyCostData: GetCostAndUsageCommandOutput): void {
    if (!dailyCostData.ResultsByTime) return;

    const dailyMap = new Map<string, DailyCost[]>();

    for (const timeResult of dailyCostData.ResultsByTime) {
      const date = timeResult.TimePeriod?.Start || '';
      
      if (timeResult.Groups) {
        for (const group of timeResult.Groups) {
          const serviceName = group.Keys?.[0];
          const cost = parseFloat(group.Metrics?.['BlendedCost']?.Amount || '0');
          
          if (serviceName && cost >= 0) {
            if (!dailyMap.has(serviceName)) {
              dailyMap.set(serviceName, []);
            }
            
            dailyMap.get(serviceName)!.push({ date, cost });
          }
        }
      }
    }

    // Update services with daily costs and calculate trends
    for (const [serviceName, dailyCosts] of dailyMap) {
      const service = serviceMap.get(serviceName);
      if (service) {
        service.dailyCosts = dailyCosts.sort((a, b) => a.date.localeCompare(b.date));
        service.trend = this.calculateTrend(dailyCosts);
      }
    }
  }

  private calculateTrend(dailyCosts: DailyCost[]): 'increasing' | 'decreasing' | 'stable' {
    if (dailyCosts.length < 2) return 'stable';

    const recentCosts = dailyCosts.slice(-7); // Last 7 days
    const olderCosts = dailyCosts.slice(-14, -7); // Previous 7 days

    if (recentCosts.length === 0 || olderCosts.length === 0) return 'stable';

    const recentAvg = recentCosts.reduce((sum, day) => sum + day.cost, 0) / recentCosts.length;
    const olderAvg = olderCosts.reduce((sum, day) => sum + day.cost, 0) / olderCosts.length;

    const changePercent = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

    if (changePercent > 10) return 'increasing';
    if (changePercent < -10) return 'decreasing';
    return 'stable';
  }

  private normalizeServiceName(serviceName: string): string {
    return serviceName
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  public async getAvailableServices(): Promise<string[]> {
    if (!this.costExplorerClient) {
      throw new Error('AWS credentials not validated');
    }

    try {
      const command = new GetDimensionValuesCommand({
        TimePeriod: {
          Start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          End: new Date().toISOString().split('T')[0]
        },
        Dimension: 'SERVICE'
      });

      const result = await this.costExplorerClient.send(command);
      return result.DimensionValues?.map(dim => dim.Value || '') || [];
    } catch (error) {
      console.error('Failed to get available services:', error);
      return [];
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      if (!this.costExplorerClient) {
        return false;
      }
      
      // Make a simple test call to verify the connection
      const command = new GetCostAndUsageCommand({
        TimePeriod: {
          Start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          End: new Date().toISOString().split('T')[0]
        },
        Granularity: 'DAILY',
        Metrics: ['BlendedCost']
      });

      await this.costExplorerClient.send(command);
      return true;
    } catch (error) {
      console.error('AWS connection test failed:', error);
      return false;
    }
  }

  public async refreshCostData(): Promise<void> {
    // Clear all cached cost data
    this.cache.flushAll();
    console.log('Cost data cache cleared, next request will fetch fresh data');
  }

  private shouldRetry(error: any): boolean {
    // Retry on throttling or temporary network errors
    if (error?.name === 'ThrottlingException' || 
        error?.name === 'RequestTimeout' ||
        error?.code === 'ECONNRESET' ||
        error?.code === 'ETIMEDOUT') {
      return true;
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getCacheStats(): { keys: number; hits: number; misses: number } {
    const stats = this.cache.getStats();
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses
    };
  }
}