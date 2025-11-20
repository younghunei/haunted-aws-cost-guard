import { create } from 'zustand';
import { networkService } from '../services/networkService';
import { cacheService } from '../services/cacheService';
import { errorRecoveryService } from '../services/errorRecoveryService';

export interface ServiceCost {
  service: string;
  displayName: string;
  totalCost: number;
  currency: string;
  budgetUtilization: number;
  regions: Array<{ region: string; cost: number; percentage: number }>;
  tags: Array<{ key: string; value: string; cost: number; percentage: number }>;
  dailyCosts: Array<{ date: string; cost: number }>;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export interface Budget {
  id: string;
  accountId: string;
  service?: string;
  amount: number;
  currency: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  alertThresholds: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetUtilization {
  service: string;
  currentCost: number;
  budgetAmount: number;
  utilizationPercentage: number;
  alertLevel: 'safe' | 'warning' | 'critical' | 'over_budget';
  projectedCost?: number;
}

interface BudgetNotification {
  id: string;
  budgetId: string;
  service: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
}

interface HauntedStore {
  services: ServiceCost[];
  selectedService: ServiceCost | null;
  demoMode: boolean;
  awsCredentials: AWSCredentials | null;
  isInitialized: boolean;
  lastUpdated: Date;
  
  // Error handling
  error: Error | string | null;
  isLoading: boolean;
  isOffline: boolean;
  
  // Budget management
  budgets: Budget[];
  budgetUtilizations: BudgetUtilization[];
  budgetNotifications: BudgetNotification[];
  showBudgetPanel: boolean;
  
  // Export and sharing
  viewSettings: {
    zoom: number;
    center: { x: number; y: number };
    showDetails: boolean;
  };
  shareData: any | null;
  
  // Actions
  setServices: (services: ServiceCost[]) => void;
  setSelectedService: (service: ServiceCost | null) => void;
  setMode: (mode: 'demo' | 'aws', credentials?: AWSCredentials) => void;
  setDemoMode: (demoMode: boolean) => void;
  refreshData: () => void;
  initialize: () => void;
  resetToHome: () => void;
  
  // Error handling actions
  setError: (error: Error | string | null) => void;
  setLoading: (loading: boolean) => void;
  setOffline: (offline: boolean) => void;
  clearError: () => void;
  retryLastOperation: () => Promise<void>;
  fallbackToDemo: () => Promise<void>;
  
  // Budget actions
  setBudgets: (budgets: Budget[]) => void;
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
  setBudgetUtilizations: (utilizations: BudgetUtilization[]) => void;
  setBudgetNotifications: (notifications: BudgetNotification[]) => void;
  acknowledgeNotification: (notificationId: string) => Promise<void>;
  setShowBudgetPanel: (show: boolean) => void;
  loadBudgets: () => Promise<void>;
  calculateBudgetUtilizations: () => void;
  
  // Export and sharing actions
  setViewSettings: (settings: Partial<HauntedStore['viewSettings']>) => void;
  setShareData: (data: any) => void;
  loadFromShareData: (shareData: any) => void;
  generateShareableState: () => any;
}

// 데모 데이터
const generateDemoData = (): ServiceCost[] => [
  {
    service: 'ec2',
    displayName: 'EC2',
    totalCost: 1250,
    currency: 'USD',
    budgetUtilization: 0.85, // 85% - Warning level
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
      { date: '11-12', cost: 120 },
      { date: '11-13', cost: 135 },
      { date: '11-14', cost: 98 },
      { date: '11-15', cost: 156 },
      { date: '11-16', cost: 189 },
      { date: '11-17', cost: 234 },
      { date: '11-18', cost: 1250 }
    ],
    trend: 'increasing'
  },
  {
    service: 's3',
    displayName: 'S3',
    totalCost: 340,
    currency: 'USD',
    budgetUtilization: 0.34, // 34% - Safe level
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
      { date: '11-12', cost: 45 },
      { date: '11-13', cost: 48 },
      { date: '11-14', cost: 52 },
      { date: '11-15', cost: 49 },
      { date: '11-16', cost: 51 },
      { date: '11-17', cost: 47 },
      { date: '11-18', cost: 340 }
    ],
    trend: 'stable'
  },
  {
    service: 'rds',
    displayName: 'RDS',
    totalCost: 890,
    currency: 'USD',
    budgetUtilization: 0.67, // 67% - Warning level
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
      { date: '11-12', cost: 125 },
      { date: '11-13', cost: 118 },
      { date: '11-14', cost: 132 },
      { date: '11-15', cost: 128 },
      { date: '11-16', cost: 135 },
      { date: '11-17', cost: 142 },
      { date: '11-18', cost: 890 }
    ],
    trend: 'increasing'
  },
  {
    service: 'lambda',
    displayName: 'Lambda',
    totalCost: 156,
    currency: 'USD',
    budgetUtilization: 0.26, // 26% - Safe level
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
      { date: '11-12', cost: 18 },
      { date: '11-13', cost: 22 },
      { date: '11-14', cost: 19 },
      { date: '11-15', cost: 25 },
      { date: '11-16', cost: 21 },
      { date: '11-17', cost: 23 },
      { date: '11-18', cost: 156 }
    ],
    trend: 'stable'
  },
  {
    service: 'cloudfront',
    displayName: 'CloudFront',
    totalCost: 2100,
    currency: 'USD',
    budgetUtilization: 1.4, // 140% - Danger! Budget exceeded
    regions: [
      { region: 'global', cost: 840, percentage: 40 },
      { region: 'us-east-1', cost: 630, percentage: 30 },
      { region: 'eu-west-1', cost: 420, percentage: 20 },
      { region: 'ap-northeast-1', cost: 210, percentage: 10 }
    ],
    tags: [
      { key: 'Content', value: 'Static', cost: 1050, percentage: 50 },
      { key: 'Content', value: 'Dynamic', cost: 630, percentage: 30 },
      { key: 'Content', value: 'Streaming', cost: 420, percentage: 20 }
    ],
    dailyCosts: [
      { date: '11-12', cost: 280 },
      { date: '11-13', cost: 295 },
      { date: '11-14', cost: 310 },
      { date: '11-15', cost: 325 },
      { date: '11-16', cost: 340 },
      { date: '11-17', cost: 365 },
      { date: '11-18', cost: 2100 }
    ],
    trend: 'increasing'
  },
  {
    service: 'dynamodb',
    displayName: 'DynamoDB',
    totalCost: 445,
    currency: 'USD',
    budgetUtilization: 0.48, // 48% - Safe level
    regions: [
      { region: 'us-east-1', cost: 178, percentage: 40 },
      { region: 'us-west-2', cost: 134, percentage: 30 },
      { region: 'eu-west-1', cost: 89, percentage: 20 },
      { region: 'ap-northeast-1', cost: 44, percentage: 10 }
    ],
    tags: [
      { key: 'Table', value: 'UserData', cost: 223, percentage: 50 },
      { key: 'Table', value: 'Sessions', cost: 134, percentage: 30 },
      { key: 'Table', value: 'Analytics', cost: 88, percentage: 20 }
    ],
    dailyCosts: [
      { date: '11-12', cost: 58 },
      { date: '11-13', cost: 62 },
      { date: '11-14', cost: 55 },
      { date: '11-15', cost: 67 },
      { date: '11-16', cost: 61 },
      { date: '11-17', cost: 59 },
      { date: '11-18', cost: 445 }
    ],
    trend: 'stable'
  }
];

export const useHauntedStore = create<HauntedStore>((set, get) => ({
  services: [],
  selectedService: null,
  demoMode: true,
  awsCredentials: null,
  isInitialized: false,
  lastUpdated: new Date(),
  
  // Error state
  error: null,
  isLoading: false,
  isOffline: false,
  
  // Budget state
  budgets: [],
  budgetUtilizations: [],
  budgetNotifications: [],
  showBudgetPanel: false,
  
  // Export and sharing state
  viewSettings: {
    zoom: 1,
    center: { x: 0, y: 0 },
    showDetails: false
  },
  shareData: null,

  setServices: (services) => set({ services, lastUpdated: new Date() }),
  
  setSelectedService: (service) => set({ selectedService: service }),
  
  setMode: async (mode: 'demo' | 'aws', credentials?: AWSCredentials) => {
    set({ isLoading: true, error: null });
    
    try {
      if (mode === 'demo') {
        const demoData = generateDemoData();
        
        set({ 
          demoMode: true,
          awsCredentials: null,
          services: demoData,
          isInitialized: true,
          lastUpdated: new Date(),
          isLoading: false,
          error: null
        });
        
        // Cache demo data for offline use
        cacheService.setCostData('demo', demoData);
        
        // Initialize demo budgets with error handling
        try {
          const response = await networkService.post('/api/budget/demo/initialize');
          if (response.data.success) {
            await get().loadBudgets();
          }
        } catch (error) {
          console.warn('Failed to initialize demo budgets, using cached data:', error);
          const cachedBudgets = cacheService.getBudgets('demo');
          if (cachedBudgets) {
            set({ budgets: cachedBudgets });
          }
        }
      } else if (mode === 'aws' && credentials) {
        try {
          // First validate credentials
          const validationResponse = await networkService.post('/api/cost/validate-credentials', credentials);
          
          if (!validationResponse.data.success) {
            throw new Error('Invalid AWS credentials');
          }
          
          // Fetch AWS data with retry logic
          const response = await errorRecoveryService.retryWithBackoff(
            () => networkService.get('/api/cost/aws'),
            'aws-cost-fetch'
          );
          
          if (response.data.success) {
            const services = response.data.data.services;
            
            set({
              demoMode: false,
              awsCredentials: credentials,
              services,
              isInitialized: true,
              lastUpdated: new Date(),
              isLoading: false,
              error: null
            });
            
            // Cache AWS data for offline use
            cacheService.setCostData('aws', services);
            
            await get().loadBudgets();
          } else {
            throw new Error(response.data.error || 'Failed to fetch AWS data');
          }
        } catch (error) {
          console.error('AWS mode setup failed:', error);
          
          // Try to use cached AWS data first
          const cachedServices = cacheService.getCostData('aws');
          if (cachedServices && cachedServices.length > 0) {
            console.log('Using cached AWS data due to network error');
            set({
              demoMode: false,
              awsCredentials: credentials,
              services: cachedServices,
              isInitialized: true,
              lastUpdated: cacheService.getLastSync('aws') || new Date(),
              isLoading: false,
              error: 'Using cached data - network unavailable',
              isOffline: true
            });
            
            const cachedBudgets = cacheService.getBudgets('aws');
            if (cachedBudgets) {
              set({ budgets: cachedBudgets });
            }
          } else {
            // Fallback to demo mode with user notification
            await errorRecoveryService.fallbackToDemoMode(
              error instanceof Error ? error.message : 'AWS connection failed'
            );
          }
        }
      }
    } catch (error) {
      console.error('Critical error in setMode:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  },
  
  setDemoMode: (demoMode) => set({ 
    demoMode, 
    services: demoMode ? generateDemoData() : [],
    lastUpdated: new Date()
  }),
  
  initialize: () => {
    set({ isInitialized: false });
  },

  resetToHome: () => {
    set({ 
      isInitialized: false,
      selectedService: null,
      showBudgetPanel: false,
      error: null,
      shareData: null
    });
  },
  
  refreshData: async () => {
    const { demoMode, awsCredentials } = get();
    set({ isLoading: true, error: null });
    
    try {
      if (demoMode) {
        const demoData = generateDemoData();
        set({ 
          services: demoData,
          lastUpdated: new Date(),
          isLoading: false
        });
        
        // Update cache
        cacheService.setCostData('demo', demoData);
      } else if (awsCredentials) {
        try {
          const response = await errorRecoveryService.retryWithBackoff(
            () => networkService.get('/api/cost/aws'),
            'aws-refresh'
          );
          
          if (response.data.success) {
            const services = response.data.data.services;
            set({ 
              services,
              lastUpdated: new Date(),
              isLoading: false,
              error: null,
              isOffline: false
            });
            
            // Update cache
            cacheService.setCostData('aws', services);
          } else {
            throw new Error(response.data.error || 'Failed to refresh data');
          }
        } catch (error) {
          console.error('Failed to refresh AWS data:', error);
          
          // Try to use cached data
          const cachedServices = cacheService.getCostData('aws');
          if (cachedServices) {
            set({
              services: cachedServices,
              lastUpdated: cacheService.getLastSync('aws') || new Date(),
              isLoading: false,
              error: 'Using cached data - refresh failed',
              isOffline: true
            });
          } else {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to refresh data'
            });
          }
        }
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error during refresh'
      });
    }
  },

  // Budget actions
  setBudgets: (budgets) => set({ budgets }),
  
  addBudget: async (budgetData) => {
    try {
      const response = await fetch('http://localhost:3001/api/budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(budgetData),
      });
      
      const result = await response.json();
      if (result.success) {
        const { budgets } = get();
        set({ budgets: [...budgets, result.data] });
        get().calculateBudgetUtilizations();
      }
    } catch (error) {
      console.error('Error adding budget:', error);
    }
  },
  
  updateBudget: async (budget) => {
    try {
      const response = await fetch('http://localhost:3001/api/budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(budget),
      });
      
      const result = await response.json();
      if (result.success) {
        const { budgets } = get();
        const updatedBudgets = budgets.map(b => b.id === budget.id ? result.data : b);
        set({ budgets: updatedBudgets });
        get().calculateBudgetUtilizations();
      }
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  },
  
  deleteBudget: async (budgetId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/budget/${budgetId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      if (result.success) {
        const { budgets } = get();
        const updatedBudgets = budgets.filter(b => b.id !== budgetId);
        set({ budgets: updatedBudgets });
        get().calculateBudgetUtilizations();
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  },
  
  setBudgetUtilizations: (utilizations) => set({ budgetUtilizations: utilizations }),
  
  setBudgetNotifications: (notifications) => set({ budgetNotifications: notifications }),
  
  acknowledgeNotification: async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/budget/notifications/${notificationId}/acknowledge`, {
        method: 'PATCH',
      });
      
      const result = await response.json();
      if (result.success) {
        const { budgetNotifications } = get();
        const updatedNotifications = budgetNotifications.map(n => 
          n.id === notificationId ? { ...n, acknowledged: true } : n
        );
        set({ budgetNotifications: updatedNotifications });
      }
    } catch (error) {
      console.error('Error acknowledging notification:', error);
    }
  },
  
  setShowBudgetPanel: (show) => set({ showBudgetPanel: show }),
  
  loadBudgets: async () => {
    try {
      const accountId = get().demoMode ? 'demo' : 'aws';
      const response = await fetch(`http://localhost:3001/api/budget/${accountId}`);
      const result = await response.json();
      
      if (result.success) {
        set({ budgets: result.data });
        get().calculateBudgetUtilizations();
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
    }
  },
  
  calculateBudgetUtilizations: () => {
    const { services, budgets } = get();
    const utilizations: BudgetUtilization[] = [];
    
    for (const service of services) {
      const budget = budgets.find(b => b.service === service.service);
      
      if (budget) {
        const utilizationPercentage = (service.totalCost / budget.amount) * 100;
        let alertLevel: 'safe' | 'warning' | 'critical' | 'over_budget' = 'safe';
        
        if (utilizationPercentage >= 100) {
          alertLevel = 'over_budget';
        } else if (utilizationPercentage >= (budget.alertThresholds[2] || 100)) {
          alertLevel = 'critical';
        } else if (utilizationPercentage >= (budget.alertThresholds[1] || 80)) {
          alertLevel = 'warning';
        }
        
        utilizations.push({
          service: service.service,
          currentCost: service.totalCost,
          budgetAmount: budget.amount,
          utilizationPercentage,
          alertLevel
        });
      }
    }
    
    set({ budgetUtilizations: utilizations });
  },

  // Error handling actions
  setError: (error) => set({ error }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setOffline: (offline) => set({ isOffline: offline }),
  
  clearError: () => set({ error: null }),
  
  retryLastOperation: async () => {
    const { demoMode, awsCredentials } = get();
    
    if (demoMode) {
      await get().refreshData();
    } else if (awsCredentials) {
      await get().setMode('aws', awsCredentials);
    }
  },
  
  fallbackToDemo: async () => {
    try {
      await get().setMode('demo');
      set({ 
        error: 'Switched to demo mode due to connection issues',
        isOffline: false 
      });
    } catch (error) {
      set({ 
        error: 'Failed to switch to demo mode' 
      });
    }
  },

  // Export and sharing actions
  setViewSettings: (settings) => {
    const { viewSettings } = get();
    set({ viewSettings: { ...viewSettings, ...settings } });
  },

  setShareData: (data) => set({ shareData: data }),

  loadFromShareData: (shareData) => {
    try {
      if (shareData && shareData.services) {
        set({
          services: shareData.services,
          selectedService: shareData.selectedService 
            ? shareData.services.find((s: ServiceCost) => s.service === shareData.selectedService) || null
            : null,
          viewSettings: shareData.viewSettings || get().viewSettings,
          demoMode: shareData.mode === 'demo',
          shareData,
          lastUpdated: new Date(shareData.timestamp)
        });
      }
    } catch (error) {
      console.error('Error loading from share data:', error);
      set({ error: 'Failed to load shared data' });
    }
  },

  generateShareableState: () => {
    const { services, selectedService, viewSettings, demoMode } = get();
    return {
      services,
      selectedService: selectedService?.service,
      viewSettings,
      timestamp: new Date(),
      mode: demoMode ? 'demo' : 'aws',
      metadata: {
        version: '1.0.0',
        sharedBy: 'Haunted AWS Cost Guard'
      }
    };
  }
}));