# 🧪 Haunted AWS Cost Guard - Testing Guide

This guide covers the comprehensive testing strategy for our supernatural cost monitoring application, including unit tests, integration tests, end-to-end tests, and performance testing.

## 🎃 Table of Contents

1. [Testing Overview](#testing-overview)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Visual Regression Testing](#visual-regression-testing)
6. [Load Testing](#load-testing)
7. [Accessibility Testing](#accessibility-testing)
8. [Running Tests](#running-tests)
9. [Test Data Management](#test-data-management)
10. [Continuous Integration](#continuous-integration)

## 👻 Testing Overview

Our testing strategy follows the testing pyramid approach with comprehensive coverage across all application layers:

```
        /\
       /  \
      / E2E \     ← Few, high-value end-to-end tests
     /______\
    /        \
   /Integration\ ← More integration tests
  /__________\
 /            \
/  Unit Tests  \   ← Many fast unit tests
/______________\
```

### Testing Stack

- **Unit Tests**: Vitest (Frontend), Jest (Backend)
- **Integration Tests**: Jest with Supertest
- **E2E Tests**: Playwright
- **Visual Regression**: Playwright Screenshots
- **Load Testing**: Artillery
- **Accessibility**: axe-core with Playwright

## 🔬 Unit Testing

### Frontend Unit Tests (Vitest)

**Test Structure:**
```typescript
// src/components/__tests__/ServiceRoom.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ServiceRoom } from '../ServiceRoom';

describe('ServiceRoom Component 👻', () => {
  const mockService = {
    service: 'EC2',
    displayName: 'EC2 Crypt',
    totalCost: 150.75,
    currency: 'USD',
    budgetUtilization: 0.65,
    regions: [],
    tags: [],
    dailyCosts: [],
    trend: 'increasing' as const
  };

  const mockOnRoomClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render service room with correct data', () => {
    render(
      <ServiceRoom 
        service={mockService} 
        onRoomClick={mockOnRoomClick} 
      />
    );

    expect(screen.getByText('EC2 Crypt')).toBeInTheDocument();
    expect(screen.getByTestId('service-room')).toHaveAttribute(
      'data-service-name', 
      'EC2'
    );
  });

  it('should display correct entity type based on budget utilization', () => {
    render(
      <ServiceRoom 
        service={mockService} 
        onRoomClick={mockOnRoomClick} 
      />
    );

    const room = screen.getByTestId('service-room');
    expect(room).toHaveAttribute('data-entity-type', 'agitated_spirit');
  });

  it('should call onRoomClick when clicked', () => {
    render(
      <ServiceRoom 
        service={mockService} 
        onRoomClick={mockOnRoomClick} 
      />
    );

    fireEvent.click(screen.getByTestId('service-room'));
    expect(mockOnRoomClick).toHaveBeenCalledWith('EC2');
  });

  it('should handle hover effects', async () => {
    render(
      <ServiceRoom 
        service={mockService} 
        onRoomClick={mockOnRoomClick} 
      />
    );

    const room = screen.getByTestId('service-room');
    
    fireEvent.mouseEnter(room);
    expect(room).toHaveClass('room-hover');
    
    fireEvent.mouseLeave(room);
    expect(room).not.toHaveClass('room-hover');
  });
});
```

**Store Testing:**
```typescript
// src/store/__tests__/hauntedStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useHauntedStore } from '../hauntedStore';

describe('HauntedStore 🏚️', () => {
  beforeEach(() => {
    // Reset store state
    useHauntedStore.getState().reset();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useHauntedStore());
    
    expect(result.current.mode).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.costData).toBeNull();
  });

  it('should set mode and trigger data loading', async () => {
    const { result } = renderHook(() => useHauntedStore());
    
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        success: true,
        data: { services: [], totalCost: 0 }
      })
    });

    await act(async () => {
      result.current.setMode('demo');
    });

    expect(result.current.mode).toBe('demo');
    expect(global.fetch).toHaveBeenCalledWith('/api/cost/demo');
  });

  it('should handle loading states correctly', async () => {
    const { result } = renderHook(() => useHauntedStore());
    
    // Mock slow API response
    global.fetch = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        json: () => Promise.resolve({ success: true, data: {} })
      }), 100))
    );

    act(() => {
      result.current.setMode('demo');
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current.isLoading).toBe(false);
  });
});
```

### Backend Unit Tests (Jest)

**Service Testing:**
```typescript
// backend/src/services/__tests__/awsService.test.ts
import { AWSService } from '../awsService';
import { CostExplorerClient } from '@aws-sdk/client-cost-explorer';

jest.mock('@aws-sdk/client-cost-explorer');

describe('AWSService 🔐', () => {
  let awsService: AWSService;
  let mockCostExplorerClient: jest.Mocked<CostExplorerClient>;

  beforeEach(() => {
    mockCostExplorerClient = {
      send: jest.fn()
    } as any;
    
    awsService = new AWSService();
    (awsService as any).costExplorerClient = mockCostExplorerClient;
  });

  describe('validateCredentials', () => {
    it('should return true for valid credentials', async () => {
      mockCostExplorerClient.send.mockResolvedValue({
        Account: '123456789012',
        UserId: 'AIDACKCEVSQ6C2EXAMPLE',
        Arn: 'arn:aws:iam::123456789012:user/testuser'
      });

      const result = await awsService.validateCredentials({
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'us-east-1'
      });

      expect(result).toBe(true);
    });

    it('should return false for invalid credentials', async () => {
      mockCostExplorerClient.send.mockRejectedValue(
        new Error('The security token included in the request is invalid')
      );

      const result = await awsService.validateCredentials({
        accessKeyId: 'INVALID',
        secretAccessKey: 'INVALID',
        region: 'us-east-1'
      });

      expect(result).toBe(false);
    });
  });

  describe('getCostData', () => {
    it('should transform AWS response correctly', async () => {
      const mockAWSResponse = {
        ResultsByTime: [{
          TimePeriod: { Start: '2024-01-01', End: '2024-01-02' },
          Groups: [{
            Keys: ['Amazon Elastic Compute Cloud - Compute'],
            Metrics: {
              BlendedCost: { Amount: '50.00', Unit: 'USD' }
            }
          }]
        }]
      };

      mockCostExplorerClient.send.mockResolvedValue(mockAWSResponse);

      const result = await awsService.getCostData({
        timeRange: { start: '2024-01-01', end: '2024-01-31' },
        demoMode: false
      });

      expect(result.services).toHaveLength(1);
      expect(result.services[0].service).toBe('Amazon Elastic Compute Cloud - Compute');
      expect(result.services[0].displayName).toBe('EC2 Crypt');
      expect(result.services[0].totalCost).toBe(50);
      expect(result.totalCost).toBe(50);
    });
  });
});
```

**Route Testing:**
```typescript
// backend/src/routes/__tests__/costRoutes.test.ts
import request from 'supertest';
import express from 'express';
import costRoutes from '../costRoutes';

const app = express();
app.use(express.json());
app.use('/api/cost', costRoutes);

describe('Cost Routes 💰', () => {
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
    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/cost/validate-credentials')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation error');
    });

    it('should accept valid credentials format', async () => {
      const credentials = {
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'us-east-1'
      };

      const response = await request(app)
        .post('/api/cost/validate-credentials')
        .send(credentials)
        .expect(401); // Will fail with fake credentials

      expect(response.body.success).toBe(false);
      expect(response.body.data.valid).toBe(false);
    });
  });
});
```

## 🔗 Integration Testing

**Full API Integration:**
```typescript
// backend/src/__tests__/integration/api.integration.test.ts
import request from 'supertest';
import app from '../../app';

describe('API Integration Tests 🌐', () => {
  describe('Complete Demo Workflow', () => {
    it('should handle complete demo user journey', async () => {
      // 1. Get demo data
      const demoResponse = await request(app)
        .get('/api/cost/demo')
        .expect(200);

      expect(demoResponse.body.success).toBe(true);
      const costData = demoResponse.body.data;

      // 2. Get demo budgets
      const budgetResponse = await request(app)
        .get('/api/budget/demo')
        .expect(200);

      expect(budgetResponse.body.success).toBe(true);

      // 3. Update a budget
      const updateResponse = await request(app)
        .put('/api/budget/demo/EC2')
        .send({
          amount: 1000,
          currency: 'USD',
          period: 'monthly',
          alertThresholds: [50, 80, 100]
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);

      // 4. Export data
      const exportResponse = await request(app)
        .post('/api/export/json')
        .send({
          format: 'json',
          includeVisuals: false
        })
        .expect(200);

      expect(exportResponse.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid routes gracefully', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Not found');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/cost/validate-credentials')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
```

## 🎭 End-to-End Testing

**Complete User Workflows:**
```typescript
// e2e/user-workflows.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete User Workflows 🎪', () => {
  test('demo mode complete workflow', async ({ page }) => {
    // Start application
    await page.goto('/');
    
    // Select demo mode
    await page.click('text=Demo Mode');
    
    // Wait for mansion to load
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // Verify all service rooms are present
    const rooms = page.locator('[data-testid="service-room"]');
    await expect(rooms).toHaveCount(5);
    
    // Test room interaction
    await page.click('[data-testid="service-room"]:has-text("EC2")');
    await expect(page.locator('[data-testid="cost-detail-panel"]')).toBeVisible();
    
    // Test budget management
    await page.click('[data-testid="budget-settings-button"]');
    await expect(page.locator('[data-testid="budget-panel"]')).toBeVisible();
    
    await page.fill('[data-testid="budget-input-ec2"]', '1500');
    await page.click('[data-testid="save-budget-button"]');
    await expect(page.getByText('Budget saved successfully')).toBeVisible();
    
    // Test export functionality
    await page.click('[data-testid="export-button"]');
    await expect(page.locator('[data-testid="export-panel"]')).toBeVisible();
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-pdf-button"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
    
    // Test sharing
    await page.click('[data-testid="generate-share-link"]');
    const shareLink = await page.locator('[data-testid="share-link-input"]').inputValue();
    expect(shareLink).toContain('http');
  });

  test('AWS mode credential workflow', async ({ page }) => {
    await page.goto('/');
    
    // Select AWS mode
    await page.click('text=AWS Account');
    
    // Test credential form
    await expect(page.locator('[data-testid="aws-credentials-form"]')).toBeVisible();
    
    // Test invalid credentials
    await page.fill('[data-testid="access-key-input"]', 'INVALID');
    await page.fill('[data-testid="secret-key-input"]', 'INVALID');
    await page.selectOption('[data-testid="region-select"]', 'us-east-1');
    
    await page.click('[data-testid="validate-credentials-button"]');
    await expect(page.getByText('Invalid AWS credentials')).toBeVisible();
    
    // Test CSV upload option
    await page.click('[data-testid="csv-upload-tab"]');
    await expect(page.locator('[data-testid="csv-upload-area"]')).toBeVisible();
  });

  test('responsive design workflow', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.click('text=Demo Mode');
    
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  });
});
```

## 📸 Visual Regression Testing

**Screenshot Comparison:**
```typescript
// e2e/visual-regression.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests 🎨', () => {
  test('mansion layout consistency', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Demo Mode');
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // Wait for animations to settle
    await page.waitForTimeout(2000);
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('mansion-full-layout.png');
    
    // Take component screenshots
    await expect(page.locator('[data-testid="haunted-mansion"]')).toHaveScreenshot('mansion-component.png');
  });

  test('entity animation states', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Demo Mode');
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // Test different entity states
    const rooms = page.locator('[data-testid="service-room"]');
    
    for (let i = 0; i < await rooms.count(); i++) {
      const room = rooms.nth(i);
      const serviceName = await room.getAttribute('data-service-name');
      
      await room.hover();
      await page.waitForTimeout(500);
      
      await expect(room).toHaveScreenshot(`room-${serviceName}-hover.png`);
    }
  });

  test('theme consistency', async ({ page }) => {
    // Test dark theme (default)
    await page.goto('/');
    await page.click('text=Demo Mode');
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    await expect(page).toHaveScreenshot('dark-theme.png');
    
    // Test light theme (if available)
    await page.click('[data-testid="theme-toggle"]');
    await expect(page).toHaveScreenshot('light-theme.png');
  });
});
```

## ⚡ Load Testing

**Artillery Configuration:**
```yaml
# load-tests/performance-test.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 20
      name: "Sustained load"
    - duration: 60
      arrivalRate: 50
      name: "Peak load"

scenarios:
  - name: "API Performance Test"
    weight: 100
    flow:
      - get:
          url: "/api/cost/demo"
          expect:
            - statusCode: 200
            - contentType: json
      - think: 1
      - get:
          url: "/api/budget/demo"
          expect:
            - statusCode: 200
```

**Custom Load Test Runner:**
```javascript
// load-tests/custom-performance.js
const { performance } = require('perf_hooks');

class PerformanceTest {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  async runTest(endpoint, concurrent = 10, duration = 60000) {
    const startTime = performance.now();
    const endTime = startTime + duration;
    const promises = [];

    console.log(`🎃 Starting performance test for ${endpoint}`);
    console.log(`Concurrent users: ${concurrent}, Duration: ${duration}ms`);

    for (let i = 0; i < concurrent; i++) {
      promises.push(this.userSimulation(endpoint, endTime));
    }

    await Promise.all(promises);
    
    this.analyzeResults();
  }

  async userSimulation(endpoint, endTime) {
    while (performance.now() < endTime) {
      const requestStart = performance.now();
      
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        const requestEnd = performance.now();
        
        this.results.push({
          timestamp: requestStart,
          duration: requestEnd - requestStart,
          status: response.status,
          success: response.ok
        });
      } catch (error) {
        this.results.push({
          timestamp: requestStart,
          duration: performance.now() - requestStart,
          status: 0,
          success: false,
          error: error.message
        });
      }

      // Random think time between 100-1000ms
      await new Promise(resolve => 
        setTimeout(resolve, Math.random() * 900 + 100)
      );
    }
  }

  analyzeResults() {
    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    
    const durations = successful.map(r => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const p95Duration = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)];
    
    console.log('\n📊 Performance Test Results:');
    console.log(`Total Requests: ${this.results.length}`);
    console.log(`Successful: ${successful.length} (${(successful.length / this.results.length * 100).toFixed(2)}%)`);
    console.log(`Failed: ${failed.length} (${(failed.length / this.results.length * 100).toFixed(2)}%)`);
    console.log(`Average Response Time: ${avgDuration.toFixed(2)}ms`);
    console.log(`95th Percentile: ${p95Duration.toFixed(2)}ms`);
    
    if (failed.length > 0) {
      console.log('\n❌ Error Summary:');
      const errorCounts = {};
      failed.forEach(f => {
        const key = f.error || `HTTP ${f.status}`;
        errorCounts[key] = (errorCounts[key] || 0) + 1;
      });
      
      Object.entries(errorCounts).forEach(([error, count]) => {
        console.log(`  ${error}: ${count} occurrences`);
      });
    }
  }
}

// Usage
async function runPerformanceTests() {
  const tester = new PerformanceTest('http://localhost:3001');
  
  await tester.runTest('/api/cost/demo', 10, 30000);
  await tester.runTest('/api/budget/demo', 5, 15000);
}

runPerformanceTests().catch(console.error);
```

## ♿ Accessibility Testing

**Automated Accessibility Tests:**
```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests ♿', () => {
  test('should not have accessibility violations on main page', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility violations on mansion view', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Demo Mode');
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[data-testid="haunted-mansion"]')
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('Demo Mode');
    
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('AWS Account');
    
    // Test enter key activation
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="aws-credentials-form"]')).toBeVisible();
  });

  test('should provide screen reader friendly content', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Demo Mode');
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // Check for ARIA labels
    const rooms = page.locator('[data-testid="service-room"]');
    
    for (let i = 0; i < await rooms.count(); i++) {
      const room = rooms.nth(i);
      await expect(room).toHaveAttribute('aria-label');
      await expect(room).toHaveAttribute('role', 'button');
    }
  });
});
```

## 🏃‍♂️ Running Tests

### Local Development

```bash
# Frontend unit tests
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:coverage     # With coverage

# Backend unit tests
cd backend
npm run test              # Single run
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage

# End-to-end tests
npm run test:e2e          # Headless mode
npm run test:e2e:ui       # Interactive UI mode

# Load tests
npm run test:load         # Run all load tests

# All tests
npm run test:all          # Unit + E2E tests
```

### Test Scripts

**package.json scripts:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:load": "node load-tests/run-load-tests.js",
    "test:accessibility": "playwright test --grep='Accessibility'",
    "test:visual": "playwright test --grep='Visual Regression'",
    "test:all": "npm run test:run && npm run test:e2e"
  }
}
```

### Environment Setup

**Test Environment Variables:**
```bash
# .env.test
VITE_API_URL=http://localhost:3001/api
VITE_ENABLE_DEMO_MODE=true
VITE_ENABLE_AWS_MODE=false

# Backend test environment
NODE_ENV=test
PORT=3001
LOG_LEVEL=error
CACHE_TTL=1000
```

## 📊 Test Data Management

### Demo Data Generation

```typescript
// src/test/fixtures/demoData.ts
export const createMockCostData = (overrides = {}): CostData => ({
  services: [
    {
      service: 'EC2',
      displayName: 'EC2 Crypt',
      totalCost: 150.75,
      currency: 'USD',
      budgetUtilization: 0.65,
      regions: [
        { region: 'us-east-1', cost: 100.50, percentage: 66.7 },
        { region: 'us-west-2', cost: 50.25, percentage: 33.3 }
      ],
      tags: [
        { key: 'Environment', value: 'Production', cost: 120.60, percentage: 80 },
        { key: 'Team', value: 'Backend', cost: 30.15, percentage: 20 }
      ],
      dailyCosts: [
        { date: '2024-01-01', cost: 25.12 },
        { date: '2024-01-02', cost: 28.45 }
      ],
      trend: 'increasing'
    }
  ],
  totalCost: 150.75,
  currency: 'USD',
  lastUpdated: new Date('2024-01-15T10:00:00Z'),
  budgetAlerts: [],
  ...overrides
});

export const createMockBudget = (overrides = {}): Budget => ({
  id: 'budget-123',
  accountId: 'demo',
  service: 'EC2',
  amount: 1000,
  currency: 'USD',
  period: 'monthly',
  alertThresholds: [50, 80, 100],
  ...overrides
});
```

### Test Database Seeding

```typescript
// backend/src/test/helpers/seedData.ts
export class TestDataSeeder {
  static async seedDemoData(): Promise<void> {
    const demoService = new DemoDataService();
    const budgetService = new BudgetService();
    
    // Clear existing data
    await demoService.clearCache();
    await budgetService.clearBudgets('demo');
    
    // Seed fresh data
    const costData = createMockCostData();
    const budgets = [
      createMockBudget({ service: 'EC2', amount: 1000 }),
      createMockBudget({ service: 'S3', amount: 500 }),
      createMockBudget({ service: 'RDS', amount: 800 })
    ];
    
    await demoService.setCostData(costData);
    budgets.forEach(budget => budgetService.setBudget(budget));
  }
  
  static async cleanupTestData(): Promise<void> {
    const demoService = new DemoDataService();
    const budgetService = new BudgetService();
    
    await demoService.clearCache();
    await budgetService.clearBudgets('demo');
  }
}
```

## 🔄 Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: 🧪 Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        npm ci
        cd backend && npm ci
    
    - name: Run frontend unit tests
      run: npm run test:coverage
    
    - name: Run backend unit tests
      run: cd backend && npm run test:coverage
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info,./backend/coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        npm ci
        cd backend && npm ci
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Build application
      run: |
        npm run build
        cd backend && npm run build
    
    - name: Start servers
      run: |
        cd backend && npm start &
        npm run preview &
        sleep 10
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/

  load-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        npm ci
        cd backend && npm ci
    
    - name: Build and start application
      run: |
        npm run build
        cd backend && npm run build && npm start &
        npm run preview &
        sleep 15
    
    - name: Run load tests
      run: npm run test:load
    
    - name: Upload load test results
      uses: actions/upload-artifact@v3
      with:
        name: load-test-results
        path: load-tests/reports/
```

### Test Reporting

```typescript
// scripts/generate-test-report.ts
import fs from 'fs';
import path from 'path';

interface TestResults {
  unit: {
    frontend: { passed: number; failed: number; coverage: number };
    backend: { passed: number; failed: number; coverage: number };
  };
  e2e: { passed: number; failed: number; duration: number };
  load: { avgResponseTime: number; errorRate: number; throughput: number };
}

class TestReporter {
  static generateReport(results: TestResults): void {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.calculateTotalTests(results),
        passRate: this.calculatePassRate(results),
        coverage: this.calculateOverallCoverage(results)
      },
      details: results,
      recommendations: this.generateRecommendations(results)
    };

    const reportPath = path.join('reports', `test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📊 Test Report Generated:');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Pass Rate: ${report.summary.passRate}%`);
    console.log(`Coverage: ${report.summary.coverage}%`);
    console.log(`Report saved to: ${reportPath}`);
  }

  private static calculateTotalTests(results: TestResults): number {
    return results.unit.frontend.passed + results.unit.frontend.failed +
           results.unit.backend.passed + results.unit.backend.failed +
           results.e2e.passed + results.e2e.failed;
  }

  private static calculatePassRate(results: TestResults): number {
    const total = this.calculateTotalTests(results);
    const passed = results.unit.frontend.passed + 
                   results.unit.backend.passed + 
                   results.e2e.passed;
    return Math.round((passed / total) * 100);
  }

  private static calculateOverallCoverage(results: TestResults): number {
    return Math.round((results.unit.frontend.coverage + results.unit.backend.coverage) / 2);
  }

  private static generateRecommendations(results: TestResults): string[] {
    const recommendations: string[] = [];

    if (results.unit.frontend.coverage < 80) {
      recommendations.push('Increase frontend test coverage to at least 80%');
    }

    if (results.unit.backend.coverage < 90) {
      recommendations.push('Increase backend test coverage to at least 90%');
    }

    if (results.load.avgResponseTime > 2000) {
      recommendations.push('Optimize API response times - currently above 2s threshold');
    }

    if (results.load.errorRate > 1) {
      recommendations.push('Investigate and fix API errors - error rate above 1%');
    }

    return recommendations;
  }
}
```

---

*May your tests always pass and your bugs be forever vanquished! 👻🧪*