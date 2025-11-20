import { MansionSnapshot } from './exportService';

export interface ShareableLink {
  id: string;
  url: string;
  expiresAt: Date;
  viewCount: number;
  maxViews?: number;
}

export interface ShareOptions {
  expirationHours?: number;
  maxViews?: number;
  includeData?: boolean;
  password?: string;
}

class ShareService {
  private readonly baseUrl = window.location.origin;
  private readonly apiUrl = 'http://localhost:3001/api';

  /**
   * Generate a shareable link for the current mansion state
   */
  async generateShareableLink(
    snapshot: MansionSnapshot,
    options: ShareOptions = {}
  ): Promise<ShareableLink> {
    try {
      const shareData = {
        snapshot,
        options: {
          expirationHours: options.expirationHours || 24,
          maxViews: options.maxViews,
          includeData: options.includeData !== false,
          password: options.password
        }
      };

      const response = await fetch(`${this.apiUrl}/export/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shareData)
      });

      if (!response.ok) {
        throw new Error('Failed to create shareable link');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create shareable link');
      }

      return {
        id: result.data.id,
        url: `${this.baseUrl}/share/${result.data.id}`,
        expiresAt: new Date(result.data.expiresAt),
        viewCount: 0,
        maxViews: options.maxViews
      };
    } catch (error) {
      console.error('Error generating shareable link:', error);
      throw new Error('Failed to generate shareable link');
    }
  }

  /**
   * Load shared mansion state from a share ID
   */
  async loadSharedState(shareId: string, password?: string): Promise<MansionSnapshot> {
    try {
      const url = new URL(`${this.apiUrl}/export/share/${shareId}`);
      if (password) {
        url.searchParams.set('password', password);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Shared link not found or expired');
        } else if (response.status === 401) {
          throw new Error('Password required or incorrect');
        } else if (response.status === 429) {
          throw new Error('Maximum view limit reached');
        }
        throw new Error('Failed to load shared state');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load shared state');
      }

      return result.data.snapshot;
    } catch (error) {
      console.error('Error loading shared state:', error);
      throw error;
    }
  }

  /**
   * Generate URL parameters for view state preservation
   */
  generateViewStateParams(viewSettings: any, selectedService?: string): URLSearchParams {
    const params = new URLSearchParams();
    
    if (viewSettings.zoom !== 1) {
      params.set('zoom', viewSettings.zoom.toString());
    }
    
    if (viewSettings.center.x !== 0 || viewSettings.center.y !== 0) {
      params.set('centerX', viewSettings.center.x.toString());
      params.set('centerY', viewSettings.center.y.toString());
    }
    
    if (viewSettings.showDetails) {
      params.set('showDetails', 'true');
    }
    
    if (selectedService) {
      params.set('selectedService', selectedService);
    }

    return params;
  }

  /**
   * Parse view state from URL parameters
   */
  parseViewStateFromUrl(): {
    viewSettings: any;
    selectedService?: string;
  } {
    const params = new URLSearchParams(window.location.search);
    
    const viewSettings = {
      zoom: parseFloat(params.get('zoom') || '1'),
      center: {
        x: parseFloat(params.get('centerX') || '0'),
        y: parseFloat(params.get('centerY') || '0')
      },
      showDetails: params.get('showDetails') === 'true'
    };

    const selectedService = params.get('selectedService') || undefined;

    return { viewSettings, selectedService };
  }

  /**
   * Update browser URL with current view state
   */
  updateUrlWithViewState(viewSettings: any, selectedService?: string): void {
    const params = this.generateViewStateParams(viewSettings, selectedService);
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    
    // Update URL without triggering navigation
    window.history.replaceState({}, '', newUrl);
  }

  /**
   * Copy shareable link to clipboard
   */
  async copyToClipboard(text: string): Promise<void> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or non-HTTPS
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      throw new Error('Failed to copy to clipboard');
    }
  }

  /**
   * Generate QR code data URL for sharing
   */
  generateQRCode(url: string): string {
    // Simple QR code generation using a service
    // In production, you might want to use a proper QR code library
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    return qrApiUrl;
  }

  /**
   * Share via Web Share API (mobile)
   */
  async shareViaNativeAPI(shareData: {
    title: string;
    text: string;
    url: string;
  }): Promise<void> {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', error);
        throw error;
      }
    } else {
      throw new Error('Web Share API not supported');
    }
  }

  /**
   * Check if Web Share API is supported
   */
  isNativeShareSupported(): boolean {
    return 'share' in navigator;
  }

  /**
   * Generate social media share URLs
   */
  generateSocialShareUrls(url: string, title: string): {
    twitter: string;
    linkedin: string;
    facebook: string;
    email: string;
  } {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedText = encodeURIComponent('Check out this AWS cost visualization from Haunted Cost Guard!');

    return {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`
    };
  }

  /**
   * Validate share ID format
   */
  isValidShareId(shareId: string): boolean {
    // Share IDs should be UUIDs or similar format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(shareId);
  }

  /**
   * Extract share ID from URL
   */
  extractShareIdFromUrl(url: string = window.location.pathname): string | null {
    const match = url.match(/\/share\/([^\/\?]+)/);
    return match ? match[1] : null;
  }

  /**
   * Generate embed code for the mansion view
   */
  generateEmbedCode(shareUrl: string, width: number = 800, height: number = 600): string {
    const embedUrl = shareUrl.replace('/share/', '/embed/');
    
    return `<iframe 
  src="${embedUrl}" 
  width="${width}" 
  height="${height}" 
  frameborder="0" 
  allowfullscreen
  title="Haunted AWS Cost Guard - Cost Visualization">
</iframe>`;
  }

  /**
   * Get share statistics
   */
  async getShareStatistics(shareId: string): Promise<{
    viewCount: number;
    maxViews?: number;
    expiresAt: Date;
    createdAt: Date;
  }> {
    try {
      const response = await fetch(`${this.apiUrl}/export/share/${shareId}/stats`);
      
      if (!response.ok) {
        throw new Error('Failed to get share statistics');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get share statistics');
      }

      return {
        viewCount: result.data.viewCount,
        maxViews: result.data.maxViews,
        expiresAt: new Date(result.data.expiresAt),
        createdAt: new Date(result.data.createdAt)
      };
    } catch (error) {
      console.error('Error getting share statistics:', error);
      throw error;
    }
  }
}

export const shareService = new ShareService();