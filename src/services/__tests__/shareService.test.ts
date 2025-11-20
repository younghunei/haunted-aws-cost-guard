import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shareService } from '../shareService';

// Mock fetch
global.fetch = vi.fn();

// Mock navigator
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve())
  },
  writable: true
});

Object.defineProperty(navigator, 'share', {
  value: vi.fn(() => Promise.resolve()),
  writable: true
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:5173',
    pathname: '/test',
    search: '?zoom=1.5&centerX=100&centerY=50&showDetails=true&selectedService=ec2'
  },
  writable: true
});

// Mock window.history
Object.defineProperty(window, 'history', {
  value: {
    replaceState: vi.fn()
  },
  writable: true
});

describe('ShareService', () => {
  const mockSnapshot = {
    timestamp: new Date(),
    services: [
      {
        service: 'ec2',
        displayName: 'EC2 Computing',
        totalCost: 1250,
        currency: 'USD',
        budgetUtilization: 0.85,
        regions: [],
        tags: [],
        dailyCosts: [],
        trend: 'increasing' as const
      }
    ],
    viewSettings: {
      zoom: 1.2,
      center: { x: 100, y: 50 },
      showDetails: true
    },
    budgets: [],
    metadata: {
      version: '1.0.0',
      mode: 'demo' as const,
      totalCost: 1250,
      currency: 'USD'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateShareableLink', () => {
    it('should create a shareable link successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await shareService.generateShareableLink(mockSnapshot, {
        expirationHours: 24,
        includeData: true
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/export/share',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('"snapshot"')
        })
      );

      expect(result).toMatchObject({
        id: mockResponse.data.id,
        url: `http://localhost:5173/share/${mockResponse.data.id}`,
        viewCount: 0
      });
    });

    it('should handle API errors gracefully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(
        shareService.generateShareableLink(mockSnapshot)
      ).rejects.toThrow('Failed to generate shareable link');
    });

    it('should handle network errors', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        shareService.generateShareableLink(mockSnapshot)
      ).rejects.toThrow('Failed to generate shareable link');
    });
  });

  describe('loadSharedState', () => {
    const shareId = '123e4567-e89b-12d3-a456-426614174000';

    it('should load shared state successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          snapshot: mockSnapshot,
          viewCount: 5,
          expiresAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await shareService.loadSharedState(shareId);

      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:3001/api/export/share/${shareId}`
      );
      expect(result).toEqual(mockSnapshot);
    });

    it('should include password in request when provided', async () => {
      const mockResponse = {
        success: true,
        data: { snapshot: mockSnapshot }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await shareService.loadSharedState(shareId, 'password123');

      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:3001/api/export/share/${shareId}?password=password123`
      );
    });

    it('should handle 404 errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(
        shareService.loadSharedState(shareId)
      ).rejects.toThrow('Shared link not found or expired');
    });

    it('should handle 401 errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await expect(
        shareService.loadSharedState(shareId)
      ).rejects.toThrow('Password required or incorrect');
    });

    it('should handle 429 errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429
      });

      await expect(
        shareService.loadSharedState(shareId)
      ).rejects.toThrow('Maximum view limit reached');
    });
  });

  describe('generateViewStateParams', () => {
    it('should generate URL parameters for view state', () => {
      const viewSettings = {
        zoom: 1.5,
        center: { x: 100, y: 50 },
        showDetails: true
      };

      const params = shareService.generateViewStateParams(viewSettings, 'ec2');

      expect(params.get('zoom')).toBe('1.5');
      expect(params.get('centerX')).toBe('100');
      expect(params.get('centerY')).toBe('50');
      expect(params.get('showDetails')).toBe('true');
      expect(params.get('selectedService')).toBe('ec2');
    });

    it('should omit default values', () => {
      const viewSettings = {
        zoom: 1,
        center: { x: 0, y: 0 },
        showDetails: false
      };

      const params = shareService.generateViewStateParams(viewSettings);

      expect(params.toString()).toBe('');
    });
  });

  describe('parseViewStateFromUrl', () => {
    it('should parse view state from URL parameters', () => {
      const result = shareService.parseViewStateFromUrl();

      expect(result.viewSettings).toEqual({
        zoom: 1.5,
        center: { x: 100, y: 50 },
        showDetails: true
      });
      expect(result.selectedService).toBe('ec2');
    });

    it('should use default values for missing parameters', () => {
      window.location.search = '';

      const result = shareService.parseViewStateFromUrl();

      expect(result.viewSettings).toEqual({
        zoom: 1,
        center: { x: 0, y: 0 },
        showDetails: false
      });
      expect(result.selectedService).toBeUndefined();
    });
  });

  describe('updateUrlWithViewState', () => {
    it('should update browser URL with view state', () => {
      const viewSettings = {
        zoom: 1.5,
        center: { x: 100, y: 50 },
        showDetails: true
      };

      shareService.updateUrlWithViewState(viewSettings, 'ec2');

      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        '',
        '/test?zoom=1.5&centerX=100&centerY=50&showDetails=true&selectedService=ec2'
      );
    });

    it('should clear URL parameters when using defaults', () => {
      const viewSettings = {
        zoom: 1,
        center: { x: 0, y: 0 },
        showDetails: false
      };

      shareService.updateUrlWithViewState(viewSettings);

      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        '',
        '/test'
      );
    });
  });

  describe('copyToClipboard', () => {
    it('should copy text using modern clipboard API', async () => {
      await shareService.copyToClipboard('test text');

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
    });

    it('should fallback to execCommand when clipboard API unavailable', async () => {
      // Mock clipboard API as unavailable
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true
      });

      // Mock document methods for fallback
      const mockTextArea = {
        value: '',
        style: {},
        focus: vi.fn(),
        select: vi.fn(),
        remove: vi.fn()
      };

      document.createElement = vi.fn(() => mockTextArea);
      document.body.appendChild = vi.fn();
      document.execCommand = vi.fn(() => true);

      await shareService.copyToClipboard('test text');

      expect(document.createElement).toHaveBeenCalledWith('textarea');
      expect(mockTextArea.value).toBe('test text');
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
  });

  describe('shareViaNativeAPI', () => {
    it('should use native share API when available', async () => {
      const shareData = {
        title: 'Test Title',
        text: 'Test Text',
        url: 'https://example.com'
      };

      await shareService.shareViaNativeAPI(shareData);

      expect(navigator.share).toHaveBeenCalledWith(shareData);
    });

    it('should throw error when native share API unavailable', async () => {
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        writable: true
      });

      await expect(
        shareService.shareViaNativeAPI({
          title: 'Test',
          text: 'Test',
          url: 'https://example.com'
        })
      ).rejects.toThrow('Web Share API not supported');
    });
  });

  describe('isNativeShareSupported', () => {
    it('should return true when share API is available', () => {
      expect(shareService.isNativeShareSupported()).toBe(true);
    });

    it('should return false when share API is unavailable', () => {
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        writable: true
      });

      expect(shareService.isNativeShareSupported()).toBe(false);
    });
  });

  describe('generateSocialShareUrls', () => {
    it('should generate correct social media URLs', () => {
      const url = 'https://example.com/share/123';
      const title = 'Test Title';

      const urls = shareService.generateSocialShareUrls(url, title);

      expect(urls.twitter).toContain('twitter.com/intent/tweet');
      expect(urls.twitter).toContain(encodeURIComponent(url));
      
      expect(urls.linkedin).toContain('linkedin.com/sharing/share-offsite');
      expect(urls.linkedin).toContain(encodeURIComponent(url));
      
      expect(urls.facebook).toContain('facebook.com/sharer/sharer.php');
      expect(urls.facebook).toContain(encodeURIComponent(url));
      
      expect(urls.email).toContain('mailto:');
      expect(urls.email).toContain(encodeURIComponent(title));
    });
  });

  describe('isValidShareId', () => {
    it('should validate correct UUID format', () => {
      const validId = '123e4567-e89b-12d3-a456-426614174000';
      expect(shareService.isValidShareId(validId)).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(shareService.isValidShareId('invalid-id')).toBe(false);
      expect(shareService.isValidShareId('123')).toBe(false);
      expect(shareService.isValidShareId('')).toBe(false);
    });
  });

  describe('extractShareIdFromUrl', () => {
    it('should extract share ID from URL path', () => {
      const shareId = '123e4567-e89b-12d3-a456-426614174000';
      const url = `/share/${shareId}`;
      
      expect(shareService.extractShareIdFromUrl(url)).toBe(shareId);
    });

    it('should return null for non-share URLs', () => {
      expect(shareService.extractShareIdFromUrl('/dashboard')).toBeNull();
      expect(shareService.extractShareIdFromUrl('/share/')).toBeNull();
    });
  });

  describe('generateQRCode', () => {
    it('should generate QR code URL', () => {
      const url = 'https://example.com/share/123';
      const qrUrl = shareService.generateQRCode(url);

      expect(qrUrl).toContain('qrserver.com');
      expect(qrUrl).toContain(encodeURIComponent(url));
    });
  });

  describe('generateEmbedCode', () => {
    it('should generate iframe embed code', () => {
      const shareUrl = 'https://example.com/share/123';
      const embedCode = shareService.generateEmbedCode(shareUrl, 800, 600);

      expect(embedCode).toContain('<iframe');
      expect(embedCode).toContain('src="https://example.com/embed/123"');
      expect(embedCode).toContain('width="800"');
      expect(embedCode).toContain('height="600"');
    });
  });

  describe('getShareStatistics', () => {
    it('should fetch share statistics successfully', async () => {
      const shareId = '123e4567-e89b-12d3-a456-426614174000';
      const mockResponse = {
        success: true,
        data: {
          viewCount: 10,
          maxViews: 100,
          expiresAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await shareService.getShareStatistics(shareId);

      expect(fetch).toHaveBeenCalledWith(
        `http://localhost:3001/api/export/share/${shareId}/stats`
      );
      expect(result.viewCount).toBe(10);
      expect(result.maxViews).toBe(100);
    });

    it('should handle API errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(
        shareService.getShareStatistics('invalid-id')
      ).rejects.toThrow('Failed to get share statistics');
    });
  });
});