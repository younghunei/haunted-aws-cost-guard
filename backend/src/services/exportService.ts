import { v4 as uuidv4 } from 'uuid';
import NodeCache from 'node-cache';

export interface ShareData {
  id: string;
  snapshot: any;
  options: {
    expirationHours: number;
    maxViews?: number;
    includeData: boolean;
    password?: string;
  };
  createdAt: Date;
  expiresAt: Date;
  viewCount: number;
}

class ExportService {
  private shareCache: NodeCache;

  constructor() {
    // Cache with TTL cleanup
    this.shareCache = new NodeCache({ 
      stdTTL: 24 * 60 * 60, // 24 hours default
      checkperiod: 60 * 60, // Check for expired keys every hour
      useClones: false
    });
  }

  /**
   * Create a shareable link for mansion data
   */
  createShareableLink(snapshot: any, options: {
    expirationHours: number;
    maxViews?: number;
    includeData: boolean;
    password?: string;
  }): ShareData {
    const id = uuidv4();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + options.expirationHours * 60 * 60 * 1000);

    const shareData: ShareData = {
      id,
      snapshot,
      options,
      createdAt,
      expiresAt,
      viewCount: 0
    };

    // Store in cache with TTL
    const ttlSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    this.shareCache.set(id, shareData, ttlSeconds);

    return shareData;
  }

  /**
   * Get shared data by ID
   */
  getSharedData(shareId: string, password?: string): ShareData | null {
    const shareData = this.shareCache.get<ShareData>(shareId);
    
    if (!shareData) {
      return null;
    }

    // Check if expired
    if (shareData.expiresAt < new Date()) {
      this.shareCache.del(shareId);
      return null;
    }

    // Check password if required
    if (shareData.options.password && shareData.options.password !== password) {
      throw new Error('Invalid password');
    }

    // Check view limit
    if (shareData.options.maxViews && shareData.viewCount >= shareData.options.maxViews) {
      throw new Error('Maximum view limit reached');
    }

    // Increment view count
    shareData.viewCount++;
    this.shareCache.set(shareId, shareData);

    return shareData;
  }

  /**
   * Get share statistics
   */
  getShareStatistics(shareId: string): {
    viewCount: number;
    maxViews?: number;
    expiresAt: Date;
    createdAt: Date;
  } | null {
    const shareData = this.shareCache.get<ShareData>(shareId);
    
    if (!shareData) {
      return null;
    }

    return {
      viewCount: shareData.viewCount,
      maxViews: shareData.options.maxViews,
      expiresAt: shareData.expiresAt,
      createdAt: shareData.createdAt
    };
  }

  /**
   * Delete expired shares (cleanup)
   */
  cleanupExpiredShares(): number {
    const keys = this.shareCache.keys();
    let deletedCount = 0;
    const now = new Date();

    for (const key of keys) {
      const shareData = this.shareCache.get<ShareData>(key);
      if (shareData && shareData.expiresAt < now) {
        this.shareCache.del(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Get all active shares (for admin purposes)
   */
  getAllActiveShares(): ShareData[] {
    const keys = this.shareCache.keys();
    const activeShares: ShareData[] = [];
    const now = new Date();

    for (const key of keys) {
      const shareData = this.shareCache.get<ShareData>(key);
      if (shareData && shareData.expiresAt > now) {
        activeShares.push(shareData);
      }
    }

    return activeShares;
  }

  /**
   * Generate CSV from cost data
   */
  generateCSV(services: any[]): string {
    const headers = [
      'Service',
      'Display Name',
      'Total Cost',
      'Currency',
      'Budget Utilization (%)',
      'Trend',
      'Top Region',
      'Top Region Cost',
      'Daily Average'
    ];

    const rows = services.map(service => {
      const topRegion = service.regions?.reduce((max: any, region: any) => 
        region.cost > (max?.cost || 0) ? region : max, null);
      
      const dailyAverage = service.dailyCosts?.length > 0 
        ? service.dailyCosts.reduce((sum: number, day: any) => sum + day.cost, 0) / service.dailyCosts.length
        : 0;

      return [
        service.service,
        service.displayName,
        service.totalCost,
        service.currency,
        (service.budgetUtilization * 100).toFixed(2),
        service.trend,
        topRegion?.region || 'N/A',
        topRegion?.cost || 0,
        dailyAverage.toFixed(2)
      ];
    });

    return [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  }

  /**
   * Generate detailed CSV with regional and tag breakdowns
   */
  generateDetailedCSV(services: any[]): string {
    const rows: string[][] = [];
    
    // Headers
    rows.push([
      'Service',
      'Display Name',
      'Total Cost',
      'Currency',
      'Budget Utilization (%)',
      'Trend',
      'Region',
      'Region Cost',
      'Region Percentage',
      'Tag Key',
      'Tag Value',
      'Tag Cost',
      'Tag Percentage',
      'Date',
      'Daily Cost'
    ]);

    services.forEach(service => {
      // Base service info
      const baseInfo = [
        service.service,
        service.displayName,
        service.totalCost.toString(),
        service.currency,
        (service.budgetUtilization * 100).toFixed(2),
        service.trend
      ];

      // Add regional breakdown
      if (service.regions?.length > 0) {
        service.regions.forEach((region: any) => {
          rows.push([
            ...baseInfo,
            region.region,
            region.cost.toString(),
            region.percentage.toString(),
            '', '', '', '', '', ''
          ]);
        });
      }

      // Add tag breakdown
      if (service.tags?.length > 0) {
        service.tags.forEach((tag: any) => {
          rows.push([
            ...baseInfo,
            '', '', '',
            tag.key,
            tag.value,
            tag.cost.toString(),
            tag.percentage.toString(),
            '', ''
          ]);
        });
      }

      // Add daily costs
      if (service.dailyCosts?.length > 0) {
        service.dailyCosts.forEach((daily: any) => {
          rows.push([
            ...baseInfo,
            '', '', '', '', '', '', '',
            daily.date,
            daily.cost.toString()
          ]);
        });
      }
    });

    return rows
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  }

  /**
   * Generate JSON export with metadata
   */
  generateJSONExport(snapshot: any): string {
    const exportData = {
      ...snapshot,
      exportedAt: new Date(),
      exportVersion: '1.0.0',
      exportedBy: 'Haunted AWS Cost Guard'
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Validate share ID format
   */
  isValidShareId(shareId: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(shareId);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    keys: number;
    hits: number;
    misses: number;
    ksize: number;
    vsize: number;
  } {
    return this.shareCache.getStats();
  }
}

export const exportService = new ExportService();