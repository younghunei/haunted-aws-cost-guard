import { describe, it, expect, beforeEach, vi } from 'vitest';
import { accessibilityService } from '../accessibilityService';

// Mock DOM methods
Object.defineProperty(document, 'getElementById', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    id: '',
    setAttribute: vi.fn(),
    style: { cssText: '' },
    textContent: '',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    hasAttribute: vi.fn(() => false)
  })),
  writable: true
});

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn(),
  writable: true
});

describe('AccessibilityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateServiceRoomDescription', () => {
    it('should generate description for peaceful ghost (low utilization)', () => {
      const service = {
        displayName: 'EC2',
        totalCost: 1500,
        budgetUtilization: 0.3,
        trend: 'stable' as const
      };

      const description = accessibilityService.generateServiceRoomDescription(service);

      expect(description.label).toBe('EC2 service room');
      expect(description.description).toContain('peaceful ghost');
      expect(description.description).toContain('$1,500');
      expect(description.description).toContain('30%');
      expect(description.description).toContain('costs are stable');
      expect(description.state).toBe('safe');
    });

    it('should generate description for agitated spirit (medium utilization)', () => {
      const service = {
        displayName: 'RDS',
        totalCost: 2500,
        budgetUtilization: 0.75,
        trend: 'increasing' as const
      };

      const description = accessibilityService.generateServiceRoomDescription(service);

      expect(description.description).toContain('agitated spirit');
      expect(description.description).toContain('costs are rising');
      expect(description.state).toBe('warning');
    });

    it('should generate description for boss monster (high utilization)', () => {
      const service = {
        displayName: 'Lambda',
        totalCost: 5000,
        budgetUtilization: 1.2,
        trend: 'decreasing' as const
      };

      const description = accessibilityService.generateServiceRoomDescription(service);

      expect(description.description).toContain('boss monster');
      expect(description.description).toContain('costs are falling');
      expect(description.state).toBe('danger');
    });
  });

  describe('generateMansionOverview', () => {
    it('should generate overview with mixed service states', () => {
      const services = [
        { displayName: 'EC2', budgetUtilization: 0.3 },
        { displayName: 'RDS', budgetUtilization: 0.8 },
        { displayName: 'Lambda', budgetUtilization: 1.2 },
        { displayName: 'S3', budgetUtilization: 0.4 }
      ];

      const overview = accessibilityService.generateMansionOverview(services);

      expect(overview).toContain('4 service rooms');
      expect(overview).toContain('1 rooms have boss monsters');
      expect(overview).toContain('1 rooms have agitated spirits');
      expect(overview).toContain('2 rooms have peaceful ghosts');
      expect(overview).toContain('Use arrow keys to navigate');
    });

    it('should handle all safe services', () => {
      const services = [
        { displayName: 'EC2', budgetUtilization: 0.3 },
        { displayName: 'S3', budgetUtilization: 0.4 }
      ];

      const overview = accessibilityService.generateMansionOverview(services);

      expect(overview).toContain('2 service rooms');
      expect(overview).toContain('2 rooms have peaceful ghosts');
      expect(overview).not.toContain('boss monsters');
      expect(overview).not.toContain('agitated spirits');
    });
  });

  describe('checkColorContrast', () => {
    it('should calculate contrast ratio correctly', () => {
      const result = accessibilityService.checkColorContrast('#ffffff', '#000000');
      
      expect(result.ratio).toBeCloseTo(21, 0);
      expect(result.wcagAA).toBe(true);
      expect(result.wcagAAA).toBe(true);
    });

    it('should identify poor contrast', () => {
      const result = accessibilityService.checkColorContrast('#cccccc', '#dddddd');
      
      expect(result.ratio).toBeLessThan(4.5);
      expect(result.wcagAA).toBe(false);
      expect(result.wcagAAA).toBe(false);
    });

    it('should handle hex colors without #', () => {
      const result = accessibilityService.checkColorContrast('ffffff', '000000');
      
      expect(result.ratio).toBeCloseTo(21, 0);
      expect(result.wcagAA).toBe(true);
    });
  });

  describe('getAccessibleEntityColor', () => {
    it('should return accessible colors for different utilization levels', () => {
      const lowUtilization = accessibilityService.getAccessibleEntityColor(0.3);
      const mediumUtilization = accessibilityService.getAccessibleEntityColor(0.7);
      const highUtilization = accessibilityService.getAccessibleEntityColor(1.2);

      expect(lowUtilization.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(mediumUtilization.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(highUtilization.color).toMatch(/^#[0-9a-f]{6}$/i);

      expect(lowUtilization.accessible).toBe(true);
      expect(mediumUtilization.accessible).toBe(true);
      expect(highUtilization.accessible).toBe(true);
    });
  });

  describe('announce', () => {
    it('should handle announcements gracefully', () => {
      // Test that announce doesn't throw errors
      expect(() => {
        accessibilityService.announce('Test message');
        accessibilityService.announce('Test message', 'assertive');
      }).not.toThrow();
    });

    it('should work with different priority levels', () => {
      expect(() => {
        accessibilityService.announce('Polite message', 'polite');
        accessibilityService.announce('Assertive message', 'assertive');
      }).not.toThrow();
    });
  });

  describe('registerKeyboardNavigation', () => {
    it('should register keyboard event handlers', () => {
      const mockElement = {
        hasAttribute: vi.fn(() => false),
        setAttribute: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };

      const config = {
        element: mockElement as any,
        onEnter: vi.fn(),
        onSpace: vi.fn(),
        onArrowKeys: vi.fn(),
        onEscape: vi.fn()
      };

      const cleanup = accessibilityService.registerKeyboardNavigation(config);

      expect(mockElement.setAttribute).toHaveBeenCalledWith('tabindex', '0');
      expect(mockElement.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));

      // Test cleanup
      cleanup();
      expect(mockElement.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should handle keyboard events correctly', () => {
      const mockElement = {
        hasAttribute: vi.fn(() => false),
        setAttribute: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };

      const config = {
        element: mockElement as any,
        onEnter: vi.fn(),
        onSpace: vi.fn(),
        onArrowKeys: vi.fn(),
        onEscape: vi.fn()
      };

      accessibilityService.registerKeyboardNavigation(config);

      // Get the event handler
      const eventHandler = (mockElement.addEventListener as any).mock.calls[0][1];

      // Test Enter key
      const enterEvent = { key: 'Enter', preventDefault: vi.fn() };
      eventHandler(enterEvent);
      expect(config.onEnter).toHaveBeenCalled();
      expect(enterEvent.preventDefault).toHaveBeenCalled();

      // Test Space key
      const spaceEvent = { key: ' ', preventDefault: vi.fn() };
      eventHandler(spaceEvent);
      expect(config.onSpace).toHaveBeenCalled();

      // Test Arrow keys
      const arrowEvent = { key: 'ArrowUp', preventDefault: vi.fn() };
      eventHandler(arrowEvent);
      expect(config.onArrowKeys).toHaveBeenCalledWith('up');

      // Test Escape key
      const escapeEvent = { key: 'Escape', preventDefault: vi.fn() };
      eventHandler(escapeEvent);
      expect(config.onEscape).toHaveBeenCalled();
    });
  });
});