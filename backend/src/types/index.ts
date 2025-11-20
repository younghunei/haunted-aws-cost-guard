export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
}

export interface ModeSelectionRequest {
  mode: 'demo' | 'aws';
  credentials?: AWSCredentials;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ServiceCost {
  service: string;
  displayName: string;
  totalCost: number;
  currency: string;
  budgetUtilization: number;
  regions: RegionCost[];
  tags: TagCost[];
  dailyCosts: DailyCost[];
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface RegionCost {
  region: string;
  cost: number;
  percentage: number;
}

export interface TagCost {
  key: string;
  value: string;
  cost: number;
  percentage: number;
}

export interface DailyCost {
  date: string;
  cost: number;
}

export interface CostData {
  services: ServiceCost[];
  totalCost: number;
  currency: string;
  lastUpdated: Date;
  budgetAlerts: BudgetAlert[];
}

export interface BudgetAlert {
  id: string;
  budgetName: string;
  alertType: 'warning' | 'critical';
  message: string;
  currentSpend: number;
  budgetLimit: number;
  utilizationPercentage: number;
}

export interface CostExplorerParams {
  startDate: string;
  endDate: string;
  granularity: 'DAILY' | 'MONTHLY';
  metrics: string[];
  groupBy?: Array<{
    Type: 'DIMENSION' | 'TAG';
    Key: string;
  }>;
}

export interface AWSCostResponse {
  ResultsByTime?: Array<{
    TimePeriod?: {
      Start?: string;
      End?: string;
    };
    Total?: Record<string, {
      Amount?: string;
      Unit?: string;
    }>;
    Groups?: Array<{
      Keys?: string[];
      Metrics?: Record<string, {
        Amount?: string;
        Unit?: string;
      }>;
    }>;
  }>;
}

export interface CostCacheEntry {
  data: CostData;
  timestamp: number;
  ttl: number;
}

export interface Budget {
  id: string;
  name: string;
  limit: number;
  spent: number;
  currency: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  alertThresholds: number[];
  services?: string[];
  tags?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetCreateRequest {
  name: string;
  limit: number;
  currency?: string;
  period?: 'monthly' | 'quarterly' | 'yearly';
  alertThresholds?: number[];
  services?: string[];
  tags?: Record<string, string>;
}

export interface BudgetUpdateRequest extends Partial<BudgetCreateRequest> {
  id: string;
}

export interface ExportRequest {
  format: 'pdf' | 'csv' | 'json';
  dateRange: {
    start: string;
    end: string;
  };
  services?: string[];
  includeCharts?: boolean;
}

export interface ExportResult {
  success: boolean;
  downloadUrl?: string;
  filename?: string;
  error?: string;
}

export interface ShareRequest {
  reportId: string;
  expiresIn?: number; // hours
  password?: string;
}

export interface ShareResult {
  success: boolean;
  shareUrl?: string;
  expiresAt?: Date;
  error?: string;
}