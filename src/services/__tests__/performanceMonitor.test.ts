import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performanceMonitor } from '../performanceMonitor';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000
  }
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
});

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16); // Simulate 60fps
  return 1;
});

global.cancelAnimationFrame = vi.fn();

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    performanceMonitor.stopMonitoring();
  });

  afterEach(() => {
    performanceMonitor.stopMonitoring();
  });

  describe('startMonitoring', () => {
    it('should start performance monitoring', () => {
      performanceMonitor.startMonitoring();
      
      expect(requestAnimationFrame).toHaveBeenCalled();
    });

    it('should not start monitoring if already monitoring', () => {
      performanceMonitor.startMonitoring();
      const firstCallCount = (requestAnimationFrame as any).mock.calls.length;
      
      performanceMonitor.startMonitoring();
      const secondCallCount = (requestAnimationFrame as any).mock.calls.length;
      
      expect(secondCallCount).toBe(firstCallCount);
    });
  });

  describe('stopMonitoring', () => {
    it('should stop performance monitoring', () => {
      performanceMonitor.startMonitoring();
      performanceMonitor.stopMonitoring();
      
      expect(cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('getMetrics', () => {
    it('should return current performance metrics', () => {
      const metrics = performanceMonitor.getMetrics();
      
      expect(metrics).toHaveProperty('fps');
      expect(metrics).toHaveProperty('frameTime');
      expect(metrics).toHaveProperty('renderTime');
      expect(metrics).toHaveProperty('lastUpdate');
      expect(typeof metrics.fps).toBe('number');
      expect(typeof metrics.frameTime).toBe('number');
    });
  });

  describe('getQualitySettings', () => {
    it('should return current quality settings', () => {
      const quality = performanceMonitor.getQualitySettings();
      
      expect(quality).toHaveProperty('level');
      expect(quality).toHaveProperty('particleCount');
      expect(quality).toHaveProperty('animationSpeed');
      expect(quality).toHaveProperty('shadowQuality');
      expect(quality).toHaveProperty('antiAliasing');
      expect(quality).toHaveProperty('maxEntities');
    });
  });

  describe('setQualityLevel', () => {
    it('should update quality settings for low quality', () => {
      performanceMonitor.setQualityLevel('low');
      const quality = performanceMonitor.getQualitySettings();
      
      expect(quality.level).toBe('low');
      expect(quality.particleCount).toBe(5);
      expect(quality.animationSpeed).toBe(0.5);
      expect(quality.shadowQuality).toBe(false);
      expect(quality.antiAliasing).toBe(false);
      expect(quality.maxEntities).toBe(20);
    });

    it('should update quality settings for medium quality', () => {
      performanceMonitor.setQualityLevel('medium');
      const quality = performanceMonitor.getQualitySettings();
      
      expect(quality.level).toBe('medium');
      expect(quality.particleCount).toBe(10);
      expect(quality.animationSpeed).toBe(0.75);
      expect(quality.shadowQuality).toBe(false);
      expect(quality.antiAliasing).toBe(true);
      expect(quality.maxEntities).toBe(30);
    });

    it('should update quality settings for high quality', () => {
      performanceMonitor.setQualityLevel('high');
      const quality = performanceMonitor.getQualitySettings();
      
      expect(quality.level).toBe('high');
      expect(quality.particleCount).toBe(20);
      expect(quality.animationSpeed).toBe(1);
      expect(quality.shadowQuality).toBe(true);
      expect(quality.antiAliasing).toBe(true);
      expect(quality.maxEntities).toBe(50);
    });

    it('should update quality settings for ultra quality', () => {
      performanceMonitor.setQualityLevel('ultra');
      const quality = performanceMonitor.getQualitySettings();
      
      expect(quality.level).toBe('ultra');
      expect(quality.particleCount).toBe(30);
      expect(quality.animationSpeed).toBe(1.2);
      expect(quality.shadowQuality).toBe(true);
      expect(quality.antiAliasing).toBe(true);
      expect(quality.maxEntities).toBe(100);
    });
  });

  describe('getPerformanceStatus', () => {
    it('should return excellent for high FPS', () => {
      // Mock high FPS
      const mockMetrics = {
        fps: 60,
        frameTime: 16.67,
        renderTime: 16.67,
        lastUpdate: Date.now()
      };
      
      // Access private method through type assertion
      (performanceMonitor as any).currentMetrics = mockMetrics;
      
      const status = performanceMonitor.getPerformanceStatus();
      expect(status).toBe('excellent');
    });

    it('should return good for moderate FPS', () => {
      const mockMetrics = {
        fps: 50,
        frameTime: 20,
        renderTime: 20,
        lastUpdate: Date.now()
      };
      
      (performanceMonitor as any).currentMetrics = mockMetrics;
      
      const status = performanceMonitor.getPerformanceStatus();
      expect(status).toBe('good');
    });

    it('should return fair for low FPS', () => {
      const mockMetrics = {
        fps: 35,
        frameTime: 28.57,
        renderTime: 28.57,
        lastUpdate: Date.now()
      };
      
      (performanceMonitor as any).currentMetrics = mockMetrics;
      
      const status = performanceMonitor.getPerformanceStatus();
      expect(status).toBe('fair');
    });

    it('should return poor for very low FPS', () => {
      const mockMetrics = {
        fps: 15,
        frameTime: 66.67,
        renderTime: 66.67,
        lastUpdate: Date.now()
      };
      
      (performanceMonitor as any).currentMetrics = mockMetrics;
      
      const status = performanceMonitor.getPerformanceStatus();
      expect(status).toBe('poor');
    });
  });

  describe('subscribe', () => {
    it('should allow subscribing to performance updates', () => {
      const callback = vi.fn();
      const unsubscribe = performanceMonitor.subscribe(callback);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Trigger a quality change to test callback
      performanceMonitor.setQualityLevel('low');
      
      expect(callback).toHaveBeenCalled();
      
      // Test unsubscribe
      unsubscribe();
      performanceMonitor.setQualityLevel('high');
      
      // Callback should not be called again after unsubscribe
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple subscribers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      const unsubscribe1 = performanceMonitor.subscribe(callback1);
      const unsubscribe2 = performanceMonitor.subscribe(callback2);
      
      performanceMonitor.setQualityLevel('medium');
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
      
      unsubscribe1();
      unsubscribe2();
    });
  });

  describe('checkPerformance', () => {
    it('should force a performance check', () => {
      const callback = vi.fn();
      performanceMonitor.subscribe(callback);
      
      // Mock poor performance
      (performanceMonitor as any).currentMetrics = {
        fps: 20,
        frameTime: 50,
        renderTime: 50,
        lastUpdate: Date.now()
      };
      
      performanceMonitor.checkPerformance();
      
      // Should have adjusted quality due to poor performance
      const quality = performanceMonitor.getQualitySettings();
      expect(quality.level).toBe('low');
    });
  });

  describe('memory usage', () => {
    it('should include memory usage when available', () => {
      const metrics = performanceMonitor.getMetrics();
      
      if (metrics.memoryUsage !== undefined) {
        expect(typeof metrics.memoryUsage).toBe('number');
        expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
        expect(metrics.memoryUsage).toBeLessThanOrEqual(1);
      }
    });

    it('should handle missing memory API', () => {
      const originalMemory = (performance as any).memory;
      delete (performance as any).memory;
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.memoryUsage).toBeUndefined();
      
      // Restore memory API
      (performance as any).memory = originalMemory;
    });
  });
});