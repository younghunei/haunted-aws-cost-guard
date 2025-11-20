import { vi } from 'vitest';
import { errorRecoveryService } from '../errorRecoveryService';
import { useHauntedStore } from '../../store/hauntedStore';

// Mock the store
vi.mock('../../store/hauntedStore');
const mockUseHauntedStore = useHauntedStore as any;

// Mock DOM methods
Object.defineProperty(document, 'body', {
  value: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
});

describe('ErrorRecoveryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    errorRecoveryService.resetRetryAttempts();
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await errorRecoveryService.retryWithBackoff(
        operation,
        'test-operation'
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');

      const result = await errorRecoveryService.retryWithBackoff(
        operation,
        'test-operation',
        { maxRetries: 3, baseDelay: 10 }
      );

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(
        errorRecoveryService.retryWithBackoff(
          operation,
          'test-operation',
          { maxRetries: 2, baseDelay: 10 }
        )
      ).rejects.toThrow('Operation failed after 2 attempts');

      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should use exponential backoff', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await errorRecoveryService.retryWithBackoff(
        operation,
        'test-operation',
        { maxRetries: 3, baseDelay: 100, backoffFactor: 2 }
      );
      const endTime = Date.now();

      // Should have waited at least 100ms for the retry
      expect(endTime - startTime).toBeGreaterThanOrEqual(90);
    });
  });

  describe('handleAWSError', () => {
    beforeEach(() => {
      mockUseHauntedStore.mockReturnValue({
        getState: () => ({
          setMode: vi.fn()
        })
      } as any);
    });

    it('should return retry for throttling errors', async () => {
      const error = { code: 'ThrottlingException', message: 'Rate exceeded' };
      
      const result = await errorRecoveryService.handleAWSError(error, 'test-op');
      
      expect(result).toBe('retry');
    });

    it('should return retry for network errors', async () => {
      const error = { code: 'ECONNRESET', message: 'Connection reset' };
      
      const result = await errorRecoveryService.handleAWSError(error, 'test-op');
      
      expect(result).toBe('retry');
    });

    it('should return fallback for credential errors', async () => {
      const error = { code: 'InvalidAccessKeyId', message: 'Invalid credentials' };
      
      const result = await errorRecoveryService.handleAWSError(error, 'test-op');
      
      expect(result).toBe('fallback');
    });

    it('should return fallback for permission errors', async () => {
      const error = { code: 'AccessDenied', message: 'Access denied' };
      
      const result = await errorRecoveryService.handleAWSError(error, 'test-op');
      
      expect(result).toBe('fallback');
    });

    it('should return fallback for service errors', async () => {
      const error = { code: 'ServiceUnavailable', message: 'Service down' };
      
      const result = await errorRecoveryService.handleAWSError(error, 'test-op');
      
      expect(result).toBe('fallback');
    });
  });

  describe('isOnline', () => {
    it('should return navigator.onLine value', () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      expect(errorRecoveryService.isOnline()).toBe(true);

      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      expect(errorRecoveryService.isOnline()).toBe(false);
    });
  });

  describe('waitForOnline', () => {
    it('should resolve immediately if already online', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });

      const result = await errorRecoveryService.waitForOnline(1000);
      expect(result).toBe(true);
    });

    it('should resolve when coming online', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      // Mock addEventListener
      const addEventListener = vi.fn();
      const removeEventListener = vi.fn();
      Object.defineProperty(window, 'addEventListener', { value: addEventListener });
      Object.defineProperty(window, 'removeEventListener', { value: removeEventListener });

      const promise = errorRecoveryService.waitForOnline(5000);

      // Simulate coming online
      setTimeout(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true
        });
        // Call the event handler
        const handler = addEventListener.mock.calls[0][1];
        handler();
      }, 100);

      const result = await promise;
      expect(result).toBe(true);
      expect(removeEventListener).toHaveBeenCalled();
    });

    it('should timeout if not coming online', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const addEventListener = vi.fn();
      const removeEventListener = vi.fn();
      Object.defineProperty(window, 'addEventListener', { value: addEventListener });
      Object.defineProperty(window, 'removeEventListener', { value: removeEventListener });

      const result = await errorRecoveryService.waitForOnline(100);
      expect(result).toBe(false);
      expect(removeEventListener).toHaveBeenCalled();
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        enableAutoFallback: false,
        fallbackDelay: 5000
      };

      errorRecoveryService.updateConfig(newConfig);
      const config = errorRecoveryService.getConfig();

      expect(config.enableAutoFallback).toBe(false);
      expect(config.fallbackDelay).toBe(5000);
    });

    it('should return current configuration', () => {
      const config = errorRecoveryService.getConfig();
      
      expect(config).toHaveProperty('enableAutoFallback');
      expect(config).toHaveProperty('fallbackDelay');
      expect(config).toHaveProperty('retryOptions');
    });
  });
});