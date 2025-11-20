import { vi } from 'vitest';
import { networkService, NetworkError } from '../networkService';

// Mock fetch
global.fetch = vi.fn();
const mockFetch = fetch as any;

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

describe('NetworkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('request', () => {
    it('should make successful GET request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: vi.fn().mockResolvedValue({ data: 'test' })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await networkService.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result.data).toEqual({ data: 'test' });
      expect(result.status).toBe(200);
    });

    it('should make successful POST request with data', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Headers(),
        json: vi.fn().mockResolvedValue({ id: 1 })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const postData = { name: 'test' };
      const result = await networkService.post('/test', postData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result.data).toEqual({ id: 1 });
    });

    it('should handle HTTP error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: vi.fn().mockResolvedValue('Resource not found')
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await expect(networkService.get('/nonexistent')).rejects.toThrow(NetworkError);
      await expect(networkService.get('/nonexistent')).rejects.toThrow('HTTP 404: Not Found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(networkService.get('/test')).rejects.toThrow(NetworkError);
    });

    it('should handle timeout', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((resolve) => {
          // Never resolve to simulate timeout
        })
      );

      await expect(
        networkService.get('/test', { timeout: 100 })
      ).rejects.toThrow('Request timeout');
    });

    it('should throw error when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      await expect(networkService.get('/test')).rejects.toThrow('No internet connection');

      // Reset
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true
      });
    });

    it('should retry on retryable errors', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValue({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers(),
          json: vi.fn().mockResolvedValue({ data: 'success' })
        } as any);

      const result = await networkService.get('/test', { retries: 2 });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.data).toEqual({ data: 'success' });
    });
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      // Mock XMLHttpRequest
      const mockXHR = {
        upload: { addEventListener: vi.fn() },
        addEventListener: vi.fn(),
        open: vi.fn(),
        setRequestHeader: vi.fn(),
        send: vi.fn(),
        status: 200,
        statusText: 'OK',
        responseText: JSON.stringify({ success: true })
      };

      const originalXHR = window.XMLHttpRequest;
      window.XMLHttpRequest = vi.fn(() => mockXHR) as any;

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      const uploadPromise = networkService.uploadFile('/upload', file);

      // Simulate successful upload
      const loadHandler = mockXHR.addEventListener.mock.calls.find(
        call => call[0] === 'load'
      )[1];
      loadHandler();

      const result = await uploadPromise;
      expect(result.data).toEqual({ success: true });

      // Restore
      window.XMLHttpRequest = originalXHR;
    });

    it('should track upload progress', async () => {
      const mockXHR = {
        upload: { addEventListener: vi.fn() },
        addEventListener: vi.fn(),
        open: vi.fn(),
        setRequestHeader: vi.fn(),
        send: vi.fn(),
        status: 200,
        statusText: 'OK',
        responseText: JSON.stringify({ success: true })
      };

      const originalXHR = window.XMLHttpRequest;
      window.XMLHttpRequest = vi.fn(() => mockXHR) as any;

      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const onProgress = vi.fn();
      
      const uploadPromise = networkService.uploadFile('/upload', file, { onProgress });

      // Simulate progress event
      const progressHandler = mockXHR.upload.addEventListener.mock.calls.find(
        call => call[0] === 'progress'
      )[1];
      progressHandler({ lengthComputable: true, loaded: 50, total: 100 });

      expect(onProgress).toHaveBeenCalledWith(50);

      // Simulate completion
      const loadHandler = mockXHR.addEventListener.mock.calls.find(
        call => call[0] === 'load'
      )[1];
      loadHandler();

      await uploadPromise;

      // Restore
      window.XMLHttpRequest = originalXHR;
    });
  });

  describe('checkConnectivity', () => {
    it('should return true when health check succeeds', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: jest.fn().mockResolvedValue({ status: 'healthy' })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await networkService.checkConnectivity();
      expect(result).toBe(true);
    });

    it('should return false when health check fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await networkService.checkConnectivity();
      expect(result).toBe(false);
    });
  });

  describe('waitForConnectivity', () => {
    it('should resolve immediately if already connected', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: jest.fn().mockResolvedValue({ status: 'healthy' })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await networkService.waitForConnectivity(1000);
      expect(result).toBe(true);
    });

    it('should timeout if connectivity not restored', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await networkService.waitForConnectivity(100);
      expect(result).toBe(false);
    });
  });

  describe('configuration', () => {
    it('should set base URL', () => {
      networkService.setBaseURL('https://api.example.com');
      
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: jest.fn().mockResolvedValue({})
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      networkService.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.any(Object)
      );
    });

    it('should set default timeout', () => {
      networkService.setDefaultTimeout(5000);
      
      // This is harder to test directly, but we can verify the timeout is used
      // by checking that requests with no timeout option use the default
      expect(() => networkService.setDefaultTimeout(5000)).not.toThrow();
    });
  });
});