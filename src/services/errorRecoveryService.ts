import { useHauntedStore } from '../store/hauntedStore';

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface ErrorRecoveryConfig {
  enableAutoFallback: boolean;
  fallbackDelay: number;
  retryOptions: RetryOptions;
}

export class ErrorRecoveryService {
  private static instance: ErrorRecoveryService;
  private config: ErrorRecoveryConfig;
  private retryAttempts = new Map<string, number>();

  private constructor() {
    this.config = {
      enableAutoFallback: true,
      fallbackDelay: 3000, // 3 seconds
      retryOptions: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2
      }
    };
  }

  public static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService();
    }
    return ErrorRecoveryService.instance;
  }

  /**
   * Retry an operation with exponential backoff
   */
  public async retryWithBackoff<T>(
    operation: () => Promise<T>,
    operationId: string,
    options?: Partial<RetryOptions>
  ): Promise<T> {
    const retryOptions = { ...this.config.retryOptions, ...options };
    const currentAttempts = this.retryAttempts.get(operationId) || 0;

    try {
      const result = await operation();
      // Reset retry count on success
      this.retryAttempts.delete(operationId);
      return result;
    } catch (error) {
      const nextAttempt = currentAttempts + 1;
      
      if (nextAttempt >= retryOptions.maxRetries) {
        this.retryAttempts.delete(operationId);
        throw new Error(`Operation failed after ${retryOptions.maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      this.retryAttempts.set(operationId, nextAttempt);
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        retryOptions.baseDelay * Math.pow(retryOptions.backoffFactor, currentAttempts),
        retryOptions.maxDelay
      );

      console.warn(`Operation ${operationId} failed (attempt ${nextAttempt}/${retryOptions.maxRetries}). Retrying in ${delay}ms...`, error);
      
      await this.delay(delay);
      return this.retryWithBackoff(operation, operationId, options);
    }
  }

  /**
   * Gracefully fallback to demo mode when AWS operations fail
   */
  public async fallbackToDemoMode(reason: string): Promise<void> {
    console.warn(`Falling back to demo mode: ${reason}`);
    
    try {
      const store = useHauntedStore.getState();
      
      // Show user notification about fallback
      this.showFallbackNotification(reason);
      
      // Wait a moment for user to see the notification
      await this.delay(this.config.fallbackDelay);
      
      // Switch to demo mode
      await store.setMode('demo');
      
      console.log('Successfully switched to demo mode');
    } catch (error) {
      console.error('Failed to fallback to demo mode:', error);
      throw new Error('Critical error: Unable to fallback to demo mode');
    }
  }

  /**
   * Handle AWS-specific errors and determine recovery strategy
   */
  public async handleAWSError(error: any, operation: string): Promise<'retry' | 'fallback' | 'fail'> {
    const errorType = this.classifyAWSError(error);
    
    switch (errorType) {
      case 'credentials':
        console.error('AWS credentials error:', error);
        if (this.config.enableAutoFallback) {
          await this.fallbackToDemoMode('Invalid or expired AWS credentials');
          return 'fallback';
        }
        return 'fail';
        
      case 'permissions':
        console.error('AWS permissions error:', error);
        if (this.config.enableAutoFallback) {
          await this.fallbackToDemoMode('Insufficient AWS permissions');
          return 'fallback';
        }
        return 'fail';
        
      case 'throttling':
        console.warn('AWS throttling detected, will retry:', error);
        return 'retry';
        
      case 'network':
        console.warn('Network error detected, will retry:', error);
        return 'retry';
        
      case 'service':
        console.error('AWS service error:', error);
        if (this.config.enableAutoFallback) {
          await this.fallbackToDemoMode('AWS service temporarily unavailable');
          return 'fallback';
        }
        return 'fail';
        
      default:
        console.error('Unknown AWS error:', error);
        return 'retry';
    }
  }

  /**
   * Classify AWS errors for appropriate handling
   */
  private classifyAWSError(error: any): 'credentials' | 'permissions' | 'throttling' | 'network' | 'service' | 'unknown' {
    if (!error) return 'unknown';
    
    const errorCode = error.code || error.name || '';
    const errorMessage = error.message || '';
    
    // Credentials errors
    if (errorCode.includes('InvalidAccessKeyId') || 
        errorCode.includes('SignatureDoesNotMatch') ||
        errorCode.includes('TokenRefreshRequired') ||
        errorMessage.includes('credentials')) {
      return 'credentials';
    }
    
    // Permission errors
    if (errorCode.includes('AccessDenied') || 
        errorCode.includes('UnauthorizedOperation') ||
        errorCode.includes('Forbidden')) {
      return 'permissions';
    }
    
    // Throttling errors
    if (errorCode.includes('Throttling') || 
        errorCode.includes('RequestLimitExceeded') ||
        errorCode.includes('TooManyRequests')) {
      return 'throttling';
    }
    
    // Network errors
    if (errorCode.includes('NetworkingError') ||
        errorCode.includes('ECONNRESET') ||
        errorCode.includes('ETIMEDOUT') ||
        errorCode.includes('ENOTFOUND')) {
      return 'network';
    }
    
    // Service errors
    if (errorCode.includes('ServiceUnavailable') ||
        errorCode.includes('InternalError') ||
        errorCode.includes('ServiceException')) {
      return 'service';
    }
    
    return 'unknown';
  }

  /**
   * Show user-friendly notification about fallback
   */
  private showFallbackNotification(reason: string): void {
    // Create a temporary notification element
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-yellow-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-xl">⚠️</span>
        <div>
          <div class="font-bold">Switching to Demo Mode</div>
          <div class="text-sm">${reason}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after delay
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, this.config.fallbackDelay + 1000);
  }

  /**
   * Check if the application is online
   */
  public isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Wait for network connectivity
   */
  public async waitForOnline(timeout = 30000): Promise<boolean> {
    if (this.isOnline()) {
      return true;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        window.removeEventListener('online', onlineHandler);
        resolve(false);
      }, timeout);

      const onlineHandler = () => {
        clearTimeout(timeoutId);
        window.removeEventListener('online', onlineHandler);
        resolve(true);
      };

      window.addEventListener('online', onlineHandler);
    });
  }

  /**
   * Utility method to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ErrorRecoveryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  public getConfig(): ErrorRecoveryConfig {
    return { ...this.config };
  }

  /**
   * Reset all retry attempts
   */
  public resetRetryAttempts(): void {
    this.retryAttempts.clear();
  }
}

// Export singleton instance
export const errorRecoveryService = ErrorRecoveryService.getInstance();