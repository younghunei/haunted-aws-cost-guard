# 🔧 Haunted AWS Cost Guard - Technical Guide

This comprehensive technical guide covers the architecture, implementation details, and development practices for the Haunted AWS Cost Guard application.

## 🎃 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Data Flow](#data-flow)
5. [API Reference](#api-reference)
6. [Database Schema](#database-schema)
7. [Testing Strategy](#testing-strategy)
8. [Performance Optimization](#performance-optimization)
9. [Development Guidelines](#development-guidelines)

## 🏗️ Architecture Overview

### System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile Browser]
    end
    
    subgraph "Frontend Layer"
        React[React Application]
        Zustand[State Management]
        Canvas[Canvas Rendering]
        Router[React Router]
    end
    
    subgraph "API Layer"
        Express[Express.js Server]
        Middleware[Middleware Stack]
        Routes[API Routes]
    end
    
    subgraph "Service Layer"
        AWS[AWS Service]
        Demo[Demo Service]
        Budget[Budget Service]
        Export[Export Service]
    end
    
    subgraph "Data Layer"
        Cache[In-Memory Cache]
        Files[File System]
    end
    
    subgraph "External Services"
        CostExplorer[AWS Cost Explorer]
        Billing[AWS Billing API]
    end
    
    Browser --> React
    Mobile --> React
    React --> Express
    Express --> AWS
    Express --> Demo
    Express --> Budget
    Express --> Export
    AWS --> CostExplorer
    AWS --> Billing
    Budget --> Cache
    Demo --> Files
```

### Technology Stack

**Frontend Technologies:**
- **React 18**: Component-based UI framework
- **TypeScript**: Type-safe JavaScript development
- **Zustand**: Lightweight state management
- **React Query**: Server state management and caching
- **Konva.js**: 2D Canvas library for animations
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Recharts**: Chart and visualization library

**Backend Technologies:**
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **TypeScript**: Type-safe server development
- **AWS SDK v3**: AWS service integration
- **Winston**: Logging framework
- **Joi**: Data validation
- **Multer**: File upload handling
- **Node-Cache**: In-memory caching

**Development Tools:**
- **Vite**: Build tool and development server
- **Vitest**: Unit testing framework
- **Playwright**: End-to-end testing
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Swagger**: API documentation

## 🎨 Frontend Architecture

### Component Hierarchy

```
App
├── ErrorBoundary
├── Router
│   ├── ModeSelection
│   │   ├── DemoModeCard
│   │   └── AWSModeCard
│   │       ├── CredentialsForm
│   │       └── CSVUpload
│   └── Dashboard
│       ├── HauntedMansion
│       │   ├── ServiceRoom[]
│       │   │   ├── SupernaturalEntity
│       │   │   └── RoomEffects
│       │   └── MansionBackground
│       ├── CostDetailPanel
│       │   ├── CostChart
│       │   ├── RegionalBreakdown
│       │   └── TagAnalysis
│       ├── BudgetPanel
│       │   ├── BudgetForm
│       │   └── BudgetNotifications
│       └── ExportPanel
│           ├── ExportOptions
│           └── ShareFeatures
```

### State Management

**Zustand Store Structure:**
```typescript
interface HauntedStore {
  // Application state
  mode: 'demo' | 'aws' | null;
  isLoading: boolean;
  error: string | null;
  
  // Cost data
  costData: CostData | null;
  selectedService: string | null;
  
  // UI state
  detailPanelOpen: boolean;
  budgetPanelOpen: boolean;
  exportPanelOpen: boolean;
  
  // Settings
  animationQuality: 'high' | 'medium' | 'low';
  theme: 'dark' | 'light';
  
  // Actions
  setMode: (mode: 'demo' | 'aws') => void;
  setCostData: (data: CostData) => void;
  setSelectedService: (service: string | null) => void;
  toggleDetailPanel: () => void;
  toggleBudgetPanel: () => void;
  toggleExportPanel: () => void;
  setAnimationQuality: (quality: 'high' | 'medium' | 'low') => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}
```

### Canvas Rendering System

**Animation Engine:**
```typescript
class AnimationEngine {
  private stage: Konva.Stage;
  private layer: Konva.Layer;
  private entities: SupernaturalEntity[] = [];
  private animationFrame: number | null = null;
  
  constructor(container: HTMLDivElement) {
    this.stage = new Konva.Stage({
      container,
      width: container.offsetWidth,
      height: container.offsetHeight
    });
    
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);
    
    this.startAnimationLoop();
  }
  
  private startAnimationLoop(): void {
    const animate = () => {
      this.entities.forEach(entity => entity.update());
      this.layer.batchDraw();
      this.animationFrame = requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  addEntity(entity: SupernaturalEntity): void {
    this.entities.push(entity);
    this.layer.add(entity.getKonvaNode());
  }
  
  removeEntity(entity: SupernaturalEntity): void {
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
      entity.getKonvaNode().destroy();
    }
  }
  
  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.stage.destroy();
  }
}
```

**Supernatural Entity System:**
```typescript
abstract class SupernaturalEntity {
  protected node: Konva.Group;
  protected intensity: number = 0;
  protected animationSpeed: number = 1;
  
  constructor(x: number, y: number) {
    this.node = new Konva.Group({ x, y });
    this.createVisuals();
  }
  
  abstract createVisuals(): void;
  abstract update(): void;
  
  setIntensity(intensity: number): void {
    this.intensity = Math.max(0, Math.min(1, intensity));
    this.updateVisuals();
  }
  
  protected abstract updateVisuals(): void;
  
  getKonvaNode(): Konva.Group {
    return this.node;
  }
}

class PeacefulGhost extends SupernaturalEntity {
  private ghost: Konva.Circle;
  private particles: Konva.Circle[] = [];
  
  createVisuals(): void {
    this.ghost = new Konva.Circle({
      radius: 20,
      fill: 'rgba(173, 216, 230, 0.7)',
      stroke: 'rgba(255, 255, 255, 0.5)',
      strokeWidth: 2
    });
    
    this.node.add(this.ghost);
    this.createParticles();
  }
  
  private createParticles(): void {
    for (let i = 0; i < 5; i++) {
      const particle = new Konva.Circle({
        x: Math.random() * 40 - 20,
        y: Math.random() * 40 - 20,
        radius: Math.random() * 3 + 1,
        fill: 'rgba(255, 255, 255, 0.3)',
        opacity: Math.random() * 0.5 + 0.2
      });
      
      this.particles.push(particle);
      this.node.add(particle);
    }
  }
  
  update(): void {
    // Gentle floating animation
    const time = Date.now() * 0.001;
    this.ghost.y(Math.sin(time * this.animationSpeed) * 5);
    
    // Particle animation
    this.particles.forEach((particle, index) => {
      const particleTime = time + index * 0.5;
      particle.x(particle.x() + Math.sin(particleTime) * 0.5);
      particle.y(particle.y() + Math.cos(particleTime) * 0.3);
      particle.opacity(0.2 + Math.sin(particleTime * 2) * 0.3);
    });
  }
  
  protected updateVisuals(): void {
    const alpha = 0.3 + this.intensity * 0.4;
    this.ghost.fill(`rgba(173, 216, 230, ${alpha})`);
    this.animationSpeed = 0.5 + this.intensity * 1.5;
  }
}
```

### Performance Optimization

**Component Memoization:**
```typescript
const ServiceRoom = React.memo<ServiceRoomProps>(({ 
  service, 
  costData, 
  onRoomClick 
}) => {
  const entityType = useMemo(() => {
    return calculateEntityType(costData.budgetUtilization);
  }, [costData.budgetUtilization]);
  
  const handleClick = useCallback(() => {
    onRoomClick(service.name);
  }, [service.name, onRoomClick]);
  
  return (
    <div 
      className="service-room"
      onClick={handleClick}
      data-testid="service-room"
      data-service-name={service.name}
      data-entity-type={entityType}
    >
      <Canvas entityType={entityType} intensity={costData.budgetUtilization} />
    </div>
  );
});
```

**Virtual Scrolling for Large Datasets:**
```typescript
const VirtualizedCostList: React.FC<{ items: CostItem[] }> = ({ items }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    const itemHeight = 60;
    const containerHeight = event.currentTarget.clientHeight;
    
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + 5,
      items.length
    );
    
    setVisibleRange({ start, end });
  }, [items.length]);
  
  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  
  return (
    <div 
      ref={containerRef}
      className="h-96 overflow-auto"
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * 60 }}>
        <div style={{ transform: `translateY(${visibleRange.start * 60}px)` }}>
          {visibleItems.map((item, index) => (
            <CostItem 
              key={visibleRange.start + index} 
              item={item} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};
```

## 🔧 Backend Architecture

### Service Layer Architecture

```typescript
// Service interface pattern
interface CostDataService {
  getCostData(params: CostQueryParams): Promise<CostData>;
  getServiceBreakdown(service: string, timeRange: TimeRange): Promise<ServiceCostData>;
  refreshCostData(accountId: string): Promise<void>;
}

// AWS Service implementation
class AWSService implements CostDataService {
  private costExplorerClient: CostExplorerClient;
  private cache: NodeCache;
  
  constructor() {
    this.costExplorerClient = new CostExplorerClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    this.cache = new NodeCache({
      stdTTL: parseInt(process.env.CACHE_TTL || '300'),
      maxKeys: parseInt(process.env.CACHE_MAX_SIZE || '100')
    });
  }
  
  async getCostData(params: CostQueryParams): Promise<CostData> {
    const cacheKey = this.generateCacheKey(params);
    const cachedData = this.cache.get<CostData>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    const costData = await this.fetchFromAWS(params);
    this.cache.set(cacheKey, costData);
    
    return costData;
  }
  
  private async fetchFromAWS(params: CostQueryParams): Promise<CostData> {
    const command = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: params.timeRange.start,
        End: params.timeRange.end
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
    
    const response = await this.costExplorerClient.send(command);
    return this.transformAWSResponse(response);
  }
  
  private transformAWSResponse(response: GetCostAndUsageCommandOutput): CostData {
    // Transform AWS response to our internal format
    const services: ServiceCost[] = [];
    
    response.ResultsByTime?.forEach(result => {
      result.Groups?.forEach(group => {
        const serviceName = group.Keys?.[0] || 'Unknown';
        const cost = parseFloat(group.Metrics?.BlendedCost?.Amount || '0');
        
        // Find or create service entry
        let service = services.find(s => s.service === serviceName);
        if (!service) {
          service = {
            service: serviceName,
            displayName: this.getDisplayName(serviceName),
            totalCost: 0,
            currency: group.Metrics?.BlendedCost?.Unit || 'USD',
            budgetUtilization: 0,
            regions: [],
            tags: [],
            dailyCosts: [],
            trend: 'stable'
          };
          services.push(service);
        }
        
        service.totalCost += cost;
        service.dailyCosts.push({
          date: result.TimePeriod?.Start || '',
          cost
        });
      });
    });
    
    return {
      services,
      totalCost: services.reduce((sum, s) => sum + s.totalCost, 0),
      currency: 'USD',
      lastUpdated: new Date(),
      budgetAlerts: []
    };
  }
  
  private getDisplayName(serviceName: string): string {
    const displayNames: Record<string, string> = {
      'Amazon Elastic Compute Cloud - Compute': 'EC2 Crypt',
      'Amazon Simple Storage Service': 'S3 Storage Cellar',
      'Amazon Relational Database Service': 'RDS Database Dungeon',
      'AWS Lambda': 'Lambda Spirit Chamber'
    };
    
    return displayNames[serviceName] || `${serviceName} Chamber`;
  }
}
```

### Middleware Stack

```typescript
// Error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  if (res.headersSent) {
    return next(error);
  }
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response: ApiResponse<null> = {
    success: false,
    error: isDevelopment ? error.message : 'Internal server error',
    ...(isDevelopment && { stack: error.stack })
  };
  
  res.status(500).json(response);
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
};

// Rate limiting middleware
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
```

### Data Validation

```typescript
// Joi validation schemas
export const costQuerySchema = Joi.object({
  accountId: Joi.string().optional(),
  timeRange: Joi.object({
    start: Joi.date().iso().required(),
    end: Joi.date().iso().min(Joi.ref('start')).required()
  }).required(),
  services: Joi.array().items(Joi.string()).optional(),
  groupBy: Joi.string().valid('service', 'region', 'tag').optional(),
  demoMode: Joi.boolean().default(false)
});

export const budgetSchema = Joi.object({
  id: Joi.string().optional(),
  accountId: Joi.string().required(),
  service: Joi.string().optional().allow(null),
  amount: Joi.number().positive().required(),
  currency: Joi.string().valid('USD', 'EUR', 'GBP').default('USD'),
  period: Joi.string().valid('monthly', 'quarterly', 'yearly').required(),
  alertThresholds: Joi.array().items(
    Joi.number().min(0).max(200)
  ).min(1).required()
});

// Validation middleware
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Validation error: ${error.details[0].message}`
      };
      
      res.status(400).json(response);
      return;
    }
    
    req.body = value;
    next();
  };
};
```

## 🔄 Data Flow

### Request Flow Diagram

```mermaid
sequenceDiagram
    participant Client
    participant Frontend
    participant API
    participant Service
    participant AWS
    participant Cache
    
    Client->>Frontend: User selects AWS mode
    Frontend->>API: POST /api/cost/validate-credentials
    API->>Service: validateCredentials()
    Service->>AWS: STS GetCallerIdentity
    AWS-->>Service: Identity response
    Service-->>API: Validation result
    API-->>Frontend: Success/Error response
    
    Frontend->>API: GET /api/cost/aws
    API->>Cache: Check for cached data
    Cache-->>API: Cache miss
    API->>Service: getCostData()
    Service->>AWS: Cost Explorer API call
    AWS-->>Service: Cost data response
    Service->>Cache: Store in cache
    Service-->>API: Transformed cost data
    API-->>Frontend: Cost data response
    
    Frontend->>Frontend: Update Zustand store
    Frontend->>Frontend: Render haunted mansion
    Frontend->>Frontend: Animate supernatural entities
```

### State Management Flow

```typescript
// Action flow in Zustand store
const useHauntedStore = create<HauntedStore>((set, get) => ({
  // Initial state
  mode: null,
  isLoading: false,
  error: null,
  costData: null,
  selectedService: null,
  detailPanelOpen: false,
  budgetPanelOpen: false,
  exportPanelOpen: false,
  animationQuality: 'high',
  theme: 'dark',
  
  // Actions
  setMode: (mode) => {
    set({ mode, error: null });
    
    // Trigger data loading based on mode
    if (mode === 'demo') {
      get().loadDemoData();
    } else if (mode === 'aws') {
      get().loadAWSData();
    }
  },
  
  loadDemoData: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/cost/demo');
      const data = await response.json();
      
      if (data.success) {
        set({ costData: data.data, isLoading: false });
      } else {
        set({ error: data.error, isLoading: false });
      }
    } catch (error) {
      set({ 
        error: 'Failed to load demo data', 
        isLoading: false 
      });
    }
  },
  
  loadAWSData: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/cost/aws');
      const data = await response.json();
      
      if (data.success) {
        set({ costData: data.data, isLoading: false });
      } else {
        set({ error: data.error, isLoading: false });
      }
    } catch (error) {
      set({ 
        error: 'Failed to load AWS data', 
        isLoading: false 
      });
    }
  },
  
  setSelectedService: (service) => {
    set({ selectedService: service });
    
    if (service) {
      set({ detailPanelOpen: true });
    }
  },
  
  toggleDetailPanel: () => {
    const { detailPanelOpen } = get();
    set({ detailPanelOpen: !detailPanelOpen });
    
    if (detailPanelOpen) {
      set({ selectedService: null });
    }
  }
}));
```

## 📚 API Reference

### Authentication Endpoints

```typescript
/**
 * POST /api/cost/validate-credentials
 * Validate AWS credentials
 */
interface ValidateCredentialsRequest {
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
  sessionToken?: string;
}

interface ValidateCredentialsResponse {
  success: boolean;
  data?: { valid: boolean };
  error?: string;
}
```

### Cost Data Endpoints

```typescript
/**
 * GET /api/cost/demo
 * Get demo cost data
 */
interface DemoDataResponse {
  success: boolean;
  data?: CostData;
  message?: string;
  error?: string;
}

/**
 * GET /api/cost/aws
 * Get real AWS cost data
 */
interface AWSCostResponse {
  success: boolean;
  data?: CostData;
  message?: string;
  error?: string;
}

/**
 * POST /api/cost/upload-csv
 * Upload Cost Explorer CSV
 */
interface CSVUploadRequest {
  csvFile: File; // multipart/form-data
}

interface CSVUploadResponse {
  success: boolean;
  data?: CostData;
  message?: string;
  error?: string;
}
```

### Budget Management Endpoints

```typescript
/**
 * GET /api/budget/:accountId
 * Get all budgets for account
 */
interface BudgetListResponse {
  success: boolean;
  data?: Budget[];
  error?: string;
}

/**
 * PUT /api/budget/:accountId/:service
 * Update service budget
 */
interface UpdateBudgetRequest {
  amount: number;
  currency: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  alertThresholds: number[];
}

interface UpdateBudgetResponse {
  success: boolean;
  data?: Budget;
  message?: string;
  error?: string;
}
```

### Export Endpoints

```typescript
/**
 * POST /api/export/pdf
 * Export mansion as PDF
 */
interface ExportPDFRequest {
  format: 'pdf';
  includeVisuals: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * POST /api/export/json
 * Export data as JSON
 */
interface ExportJSONRequest {
  format: 'json';
  includeVisuals: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}
```

## 🗄️ Database Schema

### In-Memory Cache Structure

```typescript
// Cache key patterns
const CACHE_KEYS = {
  DEMO_DATA: 'demo:cost-data',
  AWS_COST: (accountId: string, timeRange: string) => `aws:${accountId}:${timeRange}`,
  BUDGETS: (accountId: string) => `budgets:${accountId}`,
  SERVICE_BREAKDOWN: (service: string, timeRange: string) => `service:${service}:${timeRange}`
};

// Cache data structures
interface CachedCostData {
  data: CostData;
  timestamp: number;
  ttl: number;
}

interface CachedBudgets {
  budgets: Budget[];
  timestamp: number;
  ttl: number;
}
```

### File System Structure

```
backend/
├── cache/
│   ├── demo-data.json
│   └── aws-cache/
│       ├── account-123-costs.json
│       └── account-123-budgets.json
├── logs/
│   ├── combined.log
│   ├── error.log
│   └── access.log
└── uploads/
    └── temp/
        └── csv-uploads/
```

## 🧪 Testing Strategy

### Unit Testing

```typescript
// Service unit test example
describe('AWSService', () => {
  let awsService: AWSService;
  let mockCostExplorerClient: jest.Mocked<CostExplorerClient>;
  
  beforeEach(() => {
    mockCostExplorerClient = {
      send: jest.fn()
    } as any;
    
    awsService = new AWSService();
    (awsService as any).costExplorerClient = mockCostExplorerClient;
  });
  
  describe('getCostData', () => {
    it('should return cached data when available', async () => {
      const cachedData: CostData = {
        services: [],
        totalCost: 100,
        currency: 'USD',
        lastUpdated: new Date(),
        budgetAlerts: []
      };
      
      jest.spyOn(awsService as any, 'cache').mockReturnValue({
        get: jest.fn().mockReturnValue(cachedData)
      });
      
      const result = await awsService.getCostData({
        timeRange: { start: '2024-01-01', end: '2024-01-31' },
        demoMode: false
      });
      
      expect(result).toEqual(cachedData);
      expect(mockCostExplorerClient.send).not.toHaveBeenCalled();
    });
    
    it('should fetch from AWS when cache is empty', async () => {
      const awsResponse = {
        ResultsByTime: [{
          TimePeriod: { Start: '2024-01-01', End: '2024-01-02' },
          Groups: [{
            Keys: ['Amazon EC2-Instance'],
            Metrics: {
              BlendedCost: { Amount: '50.00', Unit: 'USD' }
            }
          }]
        }]
      };
      
      mockCostExplorerClient.send.mockResolvedValue(awsResponse);
      
      const result = await awsService.getCostData({
        timeRange: { start: '2024-01-01', end: '2024-01-31' },
        demoMode: false
      });
      
      expect(result.services).toHaveLength(1);
      expect(result.services[0].service).toBe('Amazon EC2-Instance');
      expect(result.services[0].totalCost).toBe(50);
    });
  });
});
```

### Integration Testing

```typescript
// API integration test example
describe('Cost API Integration', () => {
  let app: Express;
  let server: Server;
  
  beforeAll(async () => {
    app = createApp();
    server = app.listen(0);
  });
  
  afterAll(async () => {
    server.close();
  });
  
  describe('GET /api/cost/demo', () => {
    it('should return demo cost data', async () => {
      const response = await request(app)
        .get('/api/cost/demo')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('services');
      expect(response.body.data.services).toBeInstanceOf(Array);
      expect(response.body.data.services.length).toBeGreaterThan(0);
    });
  });
  
  describe('POST /api/cost/validate-credentials', () => {
    it('should validate AWS credentials', async () => {
      const credentials = {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'us-east-1'
      };
      
      const response = await request(app)
        .post('/api/cost/validate-credentials')
        .send(credentials)
        .expect(401); // Expect failure with fake credentials
      
      expect(response.body.success).toBe(false);
      expect(response.body.data.valid).toBe(false);
    });
  });
});
```

### End-to-End Testing

```typescript
// Playwright E2E test example
test('complete user workflow', async ({ page }) => {
  // Navigate to application
  await page.goto('/');
  
  // Select demo mode
  await page.click('text=Demo Mode');
  
  // Wait for mansion to load
  await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
  
  // Verify service rooms are present
  const rooms = page.locator('[data-testid="service-room"]');
  await expect(rooms).toHaveCount(5);
  
  // Click on EC2 room
  await page.click('[data-testid="service-room"]:has-text("EC2")');
  
  // Verify detail panel opens
  await expect(page.locator('[data-testid="cost-detail-panel"]')).toBeVisible();
  
  // Check cost chart is rendered
  await expect(page.locator('[data-testid="cost-chart"]')).toBeVisible();
  
  // Open budget settings
  await page.click('[data-testid="budget-settings-button"]');
  await expect(page.locator('[data-testid="budget-panel"]')).toBeVisible();
  
  // Update budget
  await page.fill('[data-testid="budget-input-ec2"]', '1000');
  await page.click('[data-testid="save-budget-button"]');
  
  // Verify success message
  await expect(page.getByText('Budget saved successfully')).toBeVisible();
  
  // Test export functionality
  await page.click('[data-testid="export-button"]');
  await expect(page.locator('[data-testid="export-panel"]')).toBeVisible();
  
  // Export as PDF
  const downloadPromise = page.waitForEvent('download');
  await page.click('[data-testid="export-pdf-button"]');
  const download = await downloadPromise;
  
  expect(download.suggestedFilename()).toContain('.pdf');
});
```

## ⚡ Performance Optimization

### Frontend Optimizations

**Code Splitting:**
```typescript
// Lazy load components
const CostDetailPanel = lazy(() => import('./components/CostDetailPanel'));
const BudgetPanel = lazy(() => import('./components/BudgetPanel'));
const ExportPanel = lazy(() => import('./components/ExportPanel'));

// Route-based code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<ModeSelection />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
```

**Canvas Performance:**
```typescript
class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  
  update(): void {
    this.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      // Adjust quality based on performance
      if (this.fps < 30) {
        this.reduceQuality();
      } else if (this.fps > 55) {
        this.increaseQuality();
      }
    }
  }
  
  private reduceQuality(): void {
    // Reduce particle count, simplify animations
    EventBus.emit('performance:reduce-quality');
  }
  
  private increaseQuality(): void {
    // Increase visual fidelity if performance allows
    EventBus.emit('performance:increase-quality');
  }
}
```

### Backend Optimizations

**Caching Strategy:**
```typescript
class SmartCache {
  private cache: NodeCache;
  private hitRate = 0;
  private totalRequests = 0;
  
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes default
      checkperiod: 60, // Check for expired keys every minute
      useClones: false // Better performance, but be careful with mutations
    });
  }
  
  get<T>(key: string): T | undefined {
    this.totalRequests++;
    const value = this.cache.get<T>(key);
    
    if (value !== undefined) {
      this.hitRate = (this.hitRate * (this.totalRequests - 1) + 1) / this.totalRequests;
    }
    
    return value;
  }
  
  set<T>(key: string, value: T, ttl?: number): void {
    // Implement smart TTL based on data type and access patterns
    const smartTTL = this.calculateSmartTTL(key, ttl);
    this.cache.set(key, value, smartTTL);
  }
  
  private calculateSmartTTL(key: string, defaultTTL?: number): number {
    // Cost data changes less frequently, cache longer
    if (key.includes('cost-data')) {
      return defaultTTL || 600; // 10 minutes
    }
    
    // Budget data changes more frequently
    if (key.includes('budget')) {
      return defaultTTL || 180; // 3 minutes
    }
    
    return defaultTTL || 300; // 5 minutes default
  }
  
  getStats(): { hitRate: number; totalRequests: number; keys: number } {
    return {
      hitRate: this.hitRate,
      totalRequests: this.totalRequests,
      keys: this.cache.keys().length
    };
  }
}
```

**Database Query Optimization:**
```typescript
class QueryOptimizer {
  static optimizeCostQuery(params: CostQueryParams): CostQueryParams {
    // Limit time range to prevent excessive data
    const maxDays = 90;
    const start = new Date(params.timeRange.start);
    const end = new Date(params.timeRange.end);
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > maxDays) {
      params.timeRange.start = new Date(end.getTime() - maxDays * 24 * 60 * 60 * 1000).toISOString();
    }
    
    // Limit services to prevent large responses
    if (params.services && params.services.length > 20) {
      params.services = params.services.slice(0, 20);
    }
    
    return params;
  }
  
  static shouldUseCache(params: CostQueryParams): boolean {
    // Use cache for recent data (last 7 days)
    const end = new Date(params.timeRange.end);
    const now = new Date();
    const daysSinceEnd = (now.getTime() - end.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysSinceEnd < 7;
  }
}
```

## 📋 Development Guidelines

### Code Style

**TypeScript Configuration:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**ESLint Configuration:**
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off"
  }
}
```

### Naming Conventions

**File Naming:**
- Components: `PascalCase.tsx` (e.g., `ServiceRoom.tsx`)
- Hooks: `camelCase.ts` (e.g., `useHauntedStore.ts`)
- Utilities: `camelCase.ts` (e.g., `formatCurrency.ts`)
- Types: `camelCase.types.ts` (e.g., `costData.types.ts`)

**Variable Naming:**
- Use Halloween-themed names where appropriate
- Be descriptive: `hauntedMansionData` instead of `data`
- Use consistent prefixes: `is`, `has`, `should` for booleans

**Function Naming:**
- Use verbs: `calculateEntityType`, `transformCostData`
- Event handlers: `handleRoomClick`, `onBudgetUpdate`
- Async functions: `fetchCostData`, `loadDemoData`

### Git Workflow

**Branch Naming:**
- Features: `feature/haunted-mansion-animations`
- Bug fixes: `fix/budget-calculation-error`
- Hotfixes: `hotfix/critical-aws-auth-issue`

**Commit Messages:**
```
feat: add supernatural entity animations 👻
fix: resolve budget calculation overflow
docs: update deployment guide with Docker
test: add E2E tests for export functionality
refactor: optimize Canvas rendering performance
```

**Pull Request Template:**
```markdown
## 🎃 Description
Brief description of changes

## 👻 Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## 🧪 Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## 📸 Screenshots
Include screenshots for UI changes

## 🔍 Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
```

---

*May your code be bug-free and your haunted mansion forever animated! 👻💻*