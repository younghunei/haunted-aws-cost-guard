import { errorRecoveryService } from './errorRecoveryService';

export interface NetworkRequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface NetworkResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class NetworkService {
  private static instance: NetworkService;
  private baseURL: string;
  private defaultTimeout: number = 10000; // 10 seconds

  private constructor() {
    this.baseURL = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3001' 
      : '';
  }

  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  /**
   * Make a network request with automatic retry and error handling
   */
  public async request<T = any>(
    url: string,
    options: RequestInit & NetworkRequestOptions = {}
  ): Promise<NetworkResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      retries = 3,
      retryDelay = 1000,
      ...fetchOptions
    } = options;

    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const operation = async (): Promise<NetworkResponse<T>> => {
      try {
        // Check if we're online
        if (!navigator.onLine) {
          throw new NetworkError('No internet connection');
        }

        const response = await fetch(fullUrl, {
          ...fetchOptions,
          signal: options.signal || controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          throw new NetworkError(
            `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
            response.status,
            response
          );
        }

        const data = await response.json().catch(() => ({}));
        
        return {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        };
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new NetworkError('Request timeout');
          }
          if (error instanceof NetworkError) {
            throw error;
          }
        }
        
        throw new NetworkError(
          error instanceof Error ? error.message : 'Network request failed'
        );
      }
    };

    try {
      return await errorRecoveryService.retryWithBackoff(
        operation,
        `network-${url}`,
        { maxRetries: retries, baseDelay: retryDelay }
      );
    } catch (error) {
      // Handle specific network errors
      if (error instanceof NetworkError) {
        if (error.status === 401 || error.status === 403) {
          // Authentication/authorization errors - don't retry
          throw error;
        }
        if (error.status && error.status >= 500) {
          // Server errors - might be temporary
          console.warn('Server error detected:', error);
        }
      }
      throw error;
    }
  }

  /**
   * GET request with error handling
   */
  public async get<T = any>(
    url: string,
    options: NetworkRequestOptions = {}
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * POST request with error handling
   */
  public async post<T = any>(
    url: string,
    data?: any,
    options: NetworkRequestOptions = {}
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * PUT request with error handling
   */
  public async put<T = any>(
    url: string,
    data?: any,
    options: NetworkRequestOptions = {}
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * DELETE request with error handling
   */
  public async delete<T = any>(
    url: string,
    options: NetworkRequestOptions = {}
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * Upload file with progress tracking
   */
  public async uploadFile<T = any>(
    url: string,
    file: File,
    options: NetworkRequestOptions & {
      onProgress?: (progress: number) => void;
      fieldName?: string;
    } = {}
  ): Promise<NetworkResponse<T>> {
    const { onProgress, fieldName = 'file', ...requestOptions } = options;
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append(fieldName, file);

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({
              data,
              status: xhr.status,
              statusText: xhr.statusText,
              headers: new Headers() // XMLHttpRequest doesn't provide easy access to response headers
            });
          } catch (error) {
            reject(new NetworkError('Invalid JSON response'));
          }
        } else {
          reject(new NetworkError(
            `Upload failed: ${xhr.status} ${xhr.statusText}`,
            xhr.status
          ));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new NetworkError('Upload failed'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new NetworkError('Upload timeout'));
      });

      xhr.timeout = requestOptions.timeout || this.defaultTimeout;
      xhr.open('POST', url.startsWith('http') ? url : `${this.baseURL}${url}`);
      
      // Add custom headers
      if (requestOptions.headers) {
        Object.entries(requestOptions.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }

      xhr.send(formData);
    });
  }

  /**
   * Check network connectivity
   */
  public async checkConnectivity(): Promise<boolean> {
    try {
      const response = await this.get('/api/cost/health', { timeout: 5000, retries: 1 });
      return response.status === 200;
    } catch (error) {
      console.warn('Connectivity check failed:', error);
      return false;
    }
  }

  /**
   * Wait for network connectivity to be restored
   */
  public async waitForConnectivity(timeout = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await this.checkConnectivity()) {
        return true;
      }
      
      // Wait 2 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return false;
  }

  /**
   * Set base URL for requests
   */
  public setBaseURL(url: string): void {
    this.baseURL = url;
  }

  /**
   * Set default timeout
   */
  public setDefaultTimeout(timeout: number): void {
    this.defaultTimeout = timeout;
  }
}

// Export singleton instance
export const networkService = NetworkService.getInstance();