import csv from 'csv-parser';
import { Readable } from 'stream';
import { 
  CostData, 
  ServiceCost, 
  CSVUploadResult, 
  DailyCost, 
  RegionCost 
} from '../types';

export class CSVUploadService {
  
  public async processCostExplorerCSV(fileBuffer: Buffer): Promise<CSVUploadResult> {
    try {
      const csvData = await this.parseCSV(fileBuffer);
      const costData = this.transformCSVToCostData(csvData);
      
      return {
        success: true,
        costData,
        rowsProcessed: csvData.length
      };
    } catch (error) {
      console.error('CSV processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error processing CSV'
      };
    }
  }

  private async parseCSV(fileBuffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(fileBuffer);
      
      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  private transformCSVToCostData(csvData: any[]): CostData {
    if (csvData.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Detect CSV format based on headers
    const headers = Object.keys(csvData[0]);
    const format = this.detectCSVFormat(headers);
    
    switch (format) {
      case 'cost-and-usage':
        return this.transformCostAndUsageCSV(csvData);
      case 'daily-costs':
        return this.transformDailyCostsCSV(csvData);
      case 'service-costs':
        return this.transformServiceCostsCSV(csvData);
      default:
        throw new Error('Unsupported CSV format. Please use a Cost Explorer export.');
    }
  }

  private detectCSVFormat(headers: string[]): string {
    const headerStr = headers.join(',').toLowerCase();
    
    if (headerStr.includes('service') && headerStr.includes('blendedcost')) {
      return 'cost-and-usage';
    }
    if (headerStr.includes('date') && headerStr.includes('cost')) {
      return 'daily-costs';
    }
    if (headerStr.includes('service') && headerStr.includes('amount')) {
      return 'service-costs';
    }
    
    return 'unknown';
  }

  private transformCostAndUsageCSV(csvData: any[]): CostData {
    const serviceMap = new Map<string, ServiceCost>();
    const regionMap = new Map<string, Map<string, number>>();
    const dailyMap = new Map<string, DailyCost[]>();

    for (const row of csvData) {
      const serviceName = row.Service || row.service || row.SERVICE;
      const cost = parseFloat(row.BlendedCost || row.Cost || row.Amount || '0');
      const region = row.Region || row.region || row.REGION || 'us-east-1';
      const date = row.Date || row.date || row.DATE;

      if (!serviceName || isNaN(cost)) continue;

      // Initialize service if not exists
      if (!serviceMap.has(serviceName)) {
        serviceMap.set(serviceName, {
          service: this.normalizeServiceName(serviceName),
          displayName: serviceName,
          totalCost: 0,
          currency: 'USD',
          budgetUtilization: 0,
          regions: [],
          tags: [],
          dailyCosts: [],
          trend: 'stable'
        });
      }

      const service = serviceMap.get(serviceName)!;
      service.totalCost += cost;

      // Track regional costs
      if (region) {
        if (!regionMap.has(serviceName)) {
          regionMap.set(serviceName, new Map());
        }
        const serviceRegions = regionMap.get(serviceName)!;
        const currentRegionCost = serviceRegions.get(region) || 0;
        serviceRegions.set(region, currentRegionCost + cost);
      }

      // Track daily costs
      if (date) {
        if (!dailyMap.has(serviceName)) {
          dailyMap.set(serviceName, []);
        }
        const existingDay = dailyMap.get(serviceName)!.find(d => d.date === date);
        if (existingDay) {
          existingDay.cost += cost;
        } else {
          dailyMap.get(serviceName)!.push({ date, cost });
        }
      }
    }

    // Add regional breakdown to services
    for (const [serviceName, regions] of regionMap) {
      const service = serviceMap.get(serviceName);
      if (service) {
        const totalServiceCost = service.totalCost;
        service.regions = Array.from(regions.entries()).map(([region, cost]) => ({
          region,
          cost,
          percentage: totalServiceCost > 0 ? (cost / totalServiceCost) * 100 : 0
        }));
      }
    }

    // Add daily costs and calculate trends
    for (const [serviceName, dailyCosts] of dailyMap) {
      const service = serviceMap.get(serviceName);
      if (service) {
        service.dailyCosts = dailyCosts.sort((a, b) => a.date.localeCompare(b.date));
        service.trend = this.calculateTrend(dailyCosts);
      }
    }

    const services = Array.from(serviceMap.values()).filter(service => service.totalCost > 0);
    const totalCost = services.reduce((sum, service) => sum + service.totalCost, 0);

    return {
      services,
      totalCost,
      currency: 'USD',
      lastUpdated: new Date(),
      budgetAlerts: []
    };
  }

  private transformDailyCostsCSV(csvData: any[]): CostData {
    const serviceMap = new Map<string, ServiceCost>();

    for (const row of csvData) {
      const serviceName = row.Service || row.service || 'Total';
      const cost = parseFloat(row.Cost || row.Amount || '0');
      const date = row.Date || row.date;

      if (isNaN(cost) || !date) continue;

      if (!serviceMap.has(serviceName)) {
        serviceMap.set(serviceName, {
          service: this.normalizeServiceName(serviceName),
          displayName: serviceName,
          totalCost: 0,
          currency: 'USD',
          budgetUtilization: 0,
          regions: [],
          tags: [],
          dailyCosts: [],
          trend: 'stable'
        });
      }

      const service = serviceMap.get(serviceName)!;
      service.totalCost += cost;
      service.dailyCosts.push({ date, cost });
    }

    // Calculate trends for each service
    for (const service of serviceMap.values()) {
      service.dailyCosts.sort((a, b) => a.date.localeCompare(b.date));
      service.trend = this.calculateTrend(service.dailyCosts);
    }

    const services = Array.from(serviceMap.values()).filter(service => service.totalCost > 0);
    const totalCost = services.reduce((sum, service) => sum + service.totalCost, 0);

    return {
      services,
      totalCost,
      currency: 'USD',
      lastUpdated: new Date(),
      budgetAlerts: []
    };
  }

  private transformServiceCostsCSV(csvData: any[]): CostData {
    const services: ServiceCost[] = [];

    for (const row of csvData) {
      const serviceName = row.Service || row.service;
      const cost = parseFloat(row.Amount || row.Cost || '0');

      if (!serviceName || isNaN(cost)) continue;

      services.push({
        service: this.normalizeServiceName(serviceName),
        displayName: serviceName,
        totalCost: cost,
        currency: 'USD',
        budgetUtilization: 0,
        regions: [],
        tags: [],
        dailyCosts: [],
        trend: 'stable'
      });
    }

    const totalCost = services.reduce((sum, service) => sum + service.totalCost, 0);

    return {
      services: services.filter(service => service.totalCost > 0),
      totalCost,
      currency: 'USD',
      lastUpdated: new Date(),
      budgetAlerts: []
    };
  }

  private calculateTrend(dailyCosts: DailyCost[]): 'increasing' | 'decreasing' | 'stable' {
    if (dailyCosts.length < 2) return 'stable';

    const sortedCosts = dailyCosts.sort((a, b) => a.date.localeCompare(b.date));
    const recentCosts = sortedCosts.slice(-7); // Last 7 days
    const olderCosts = sortedCosts.slice(-14, -7); // Previous 7 days

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

  public validateCSVFormat(fileBuffer: Buffer): Promise<{ valid: boolean; format?: string; error?: string }> {
    return new Promise((resolve) => {
      try {
        const stream = Readable.from(fileBuffer);
        let headersParsed = false;
        
        stream
          .pipe(csv())
          .on('data', (data) => {
            if (!headersParsed) {
              const headers = Object.keys(data);
              const format = this.detectCSVFormat(headers);
              
              if (format === 'unknown') {
                resolve({
                  valid: false,
                  error: 'Unsupported CSV format. Expected Cost Explorer export with Service and Cost columns.'
                });
              } else {
                resolve({
                  valid: true,
                  format
                });
              }
              headersParsed = true;
            }
          })
          .on('error', (error) => {
            resolve({
              valid: false,
              error: `CSV parsing error: ${error.message}`
            });
          });
      } catch (error) {
        resolve({
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown validation error'
        });
      }
    });
  }
}