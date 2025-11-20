import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportPanel } from '../ExportPanel';

// Mock dependencies
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, ...props }: any) => (
      <div className={className} onClick={onClick} {...props}>
        {children}
      </div>
    )
  },
  AnimatePresence: ({ children }: any) => children
}));

vi.mock('../services/exportService', () => ({
  exportService: {
    generateMansionSnapshot: vi.fn(() => ({
      timestamp: new Date(),
      services: [],
      viewSettings: { zoom: 1, center: { x: 0, y: 0 }, showDetails: false },
      budgets: [],
      metadata: { version: '1.0.0', mode: 'demo', totalCost: 0, currency: 'USD' }
    })),
    exportToPDF: vi.fn(() => Promise.resolve()),
    exportToPNG: vi.fn(() => Promise.resolve()),
    exportToJSON: vi.fn(),
    exportToCSV: vi.fn(),
    printMansion: vi.fn()
  }
}));

vi.mock('../services/shareService', () => ({
  shareService: {
    generateShareableLink: vi.fn(() => Promise.resolve({
      id: 'test-id',
      url: 'https://example.com/share/test-id',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      viewCount: 0
    })),
    copyToClipboard: vi.fn(() => Promise.resolve()),
    shareViaNativeAPI: vi.fn(() => Promise.resolve()),
    isNativeShareSupported: vi.fn(() => true),
    generateQRCode: vi.fn(() => 'https://api.qrserver.com/v1/create-qr-code/?data=test'),
    generateSocialShareUrls: vi.fn(() => ({
      twitter: 'https://twitter.com/intent/tweet?url=test',
      linkedin: 'https://linkedin.com/sharing/share-offsite/?url=test',
      facebook: 'https://facebook.com/sharer/sharer.php?u=test',
      email: 'mailto:?subject=test&body=test'
    }))
  }
}));

// Mock store
const mockStore = {
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
      trend: 'increasing'
    }
  ],
  viewSettings: { zoom: 1, center: { x: 0, y: 0 }, showDetails: false },
  budgets: [],
  demoMode: true,
  generateShareableState: vi.fn(() => ({}))
};

vi.mock('../store/hauntedStore', () => ({
  useHauntedStore: () => mockStore
}));

describe('ExportPanel', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(<ExportPanel {...defaultProps} />);
    
    expect(screen.getByText('Export & Share')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<ExportPanel {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Export & Share')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ExportPanel {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<ExportPanel {...defaultProps} onClose={onClose} />);
    
    // Find backdrop (first div with bg-black bg-opacity-50)
    const backdrop = document.querySelector('.bg-black.bg-opacity-50');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  describe('Export Tab', () => {
    it('should show export tab by default', () => {
      render(<ExportPanel {...defaultProps} />);
      
      expect(screen.getByText('Export')).toHaveClass('text-purple-400');
      expect(screen.getByText('Export Format')).toBeInTheDocument();
    });

    it('should show all export format options', () => {
      render(<ExportPanel {...defaultProps} />);
      
      expect(screen.getByText('PDF Report')).toBeInTheDocument();
      expect(screen.getByText('PNG Image')).toBeInTheDocument();
      expect(screen.getByText('JSON Data')).toBeInTheDocument();
      expect(screen.getByText('CSV Data')).toBeInTheDocument();
    });

    it('should allow selecting different export formats', () => {
      render(<ExportPanel {...defaultProps} />);
      
      const pngButton = screen.getByText('PNG Image').closest('button');
      fireEvent.click(pngButton!);
      
      expect(pngButton).toHaveClass('border-purple-500', 'bg-purple-900');
    });

    it('should show export options checkboxes', () => {
      render(<ExportPanel {...defaultProps} />);
      
      expect(screen.getByLabelText(/include visual representation/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/include cost data/i)).toBeInTheDocument();
    });

    it('should handle PDF export', async () => {
      const { exportService } = await import('../services/exportService');
      render(<ExportPanel {...defaultProps} />);
      
      const exportButton = screen.getByText(/Export PDF/i);
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(exportService.exportToPDF).toHaveBeenCalled();
      });
    });

    it('should handle PNG export', async () => {
      const { exportService } = await import('../services/exportService');
      render(<ExportPanel {...defaultProps} />);
      
      // Select PNG format
      const pngButton = screen.getByText('PNG Image').closest('button');
      fireEvent.click(pngButton!);
      
      const exportButton = screen.getByText(/Export PNG/i);
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(exportService.exportToPNG).toHaveBeenCalled();
      });
    });

    it('should handle JSON export', async () => {
      const { exportService } = await import('../services/exportService');
      render(<ExportPanel {...defaultProps} />);
      
      // Select JSON format
      const jsonButton = screen.getByText('JSON Data').closest('button');
      fireEvent.click(jsonButton!);
      
      const exportButton = screen.getByText(/Export JSON/i);
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(exportService.exportToJSON).toHaveBeenCalled();
      });
    });

    it('should handle CSV export', async () => {
      const { exportService } = await import('../services/exportService');
      render(<ExportPanel {...defaultProps} />);
      
      // Select CSV format
      const csvButton = screen.getByText('CSV Data').closest('button');
      fireEvent.click(csvButton!);
      
      const exportButton = screen.getByText(/Export CSV/i);
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(exportService.exportToCSV).toHaveBeenCalled();
      });
    });

    it('should handle print functionality', async () => {
      const { exportService } = await import('../services/exportService');
      render(<ExportPanel {...defaultProps} />);
      
      const printButton = screen.getByText(/Print Mansion/i);
      fireEvent.click(printButton);
      
      expect(exportService.printMansion).toHaveBeenCalled();
    });

    it('should show loading state during export', async () => {
      const { exportService } = await import('../services/exportService');
      exportService.exportToPDF = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<ExportPanel {...defaultProps} />);
      
      const exportButton = screen.getByText(/Export PDF/i);
      fireEvent.click(exportButton);
      
      expect(screen.getByText(/Exporting.../i)).toBeInTheDocument();
    });
  });

  describe('Share Tab', () => {
    it('should switch to share tab', () => {
      render(<ExportPanel {...defaultProps} />);
      
      const shareTab = screen.getByText('Share');
      fireEvent.click(shareTab);
      
      expect(shareTab).toHaveClass('text-purple-400');
      expect(screen.getByText('Share Settings')).toBeInTheDocument();
    });

    it('should show share settings', () => {
      render(<ExportPanel {...defaultProps} />);
      
      const shareTab = screen.getByText('Share');
      fireEvent.click(shareTab);
      
      expect(screen.getByText(/Expiration \(hours\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Max Views \(optional\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Password \(optional\)/i)).toBeInTheDocument();
    });

    it('should allow configuring share options', () => {
      render(<ExportPanel {...defaultProps} />);
      
      const shareTab = screen.getByText('Share');
      fireEvent.click(shareTab);
      
      const expirationSelect = screen.getByDisplayValue('24 hours');
      fireEvent.change(expirationSelect, { target: { value: '168' } });
      
      expect(expirationSelect).toHaveValue('168');
    });

    it('should generate shareable link', async () => {
      const { shareService } = await import('../services/shareService');
      render(<ExportPanel {...defaultProps} />);
      
      const shareTab = screen.getByText('Share');
      fireEvent.click(shareTab);
      
      const generateButton = screen.getByText(/Generate Shareable Link/i);
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(shareService.generateShareableLink).toHaveBeenCalled();
      });
    });

    it('should show generated link interface', async () => {
      render(<ExportPanel {...defaultProps} />);
      
      const shareTab = screen.getByText('Share');
      fireEvent.click(shareTab);
      
      const generateButton = screen.getByText(/Generate Shareable Link/i);
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText('Shareable Link')).toBeInTheDocument();
        expect(screen.getByText('Copy')).toBeInTheDocument();
      });
    });

    it('should handle copy to clipboard', async () => {
      const { shareService } = await import('../services/shareService');
      render(<ExportPanel {...defaultProps} />);
      
      const shareTab = screen.getByText('Share');
      fireEvent.click(shareTab);
      
      const generateButton = screen.getByText(/Generate Shareable Link/i);
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        const copyButton = screen.getByText('Copy');
        fireEvent.click(copyButton);
        
        expect(shareService.copyToClipboard).toHaveBeenCalled();
      });
    });

    it('should show QR code when link is generated', async () => {
      render(<ExportPanel {...defaultProps} />);
      
      const shareTab = screen.getByText('Share');
      fireEvent.click(shareTab);
      
      const generateButton = screen.getByText(/Generate Shareable Link/i);
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        const qrImage = screen.getByAltText('QR Code');
        expect(qrImage).toBeInTheDocument();
      });
    });

    it('should show social media share options', async () => {
      render(<ExportPanel {...defaultProps} />);
      
      const shareTab = screen.getByText('Share');
      fireEvent.click(shareTab);
      
      const generateButton = screen.getByText(/Generate Shareable Link/i);
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText('Twitter')).toBeInTheDocument();
        expect(screen.getByText('LinkedIn')).toBeInTheDocument();
        expect(screen.getByText('Facebook')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
      });
    });

    it('should allow creating new link', async () => {
      render(<ExportPanel {...defaultProps} />);
      
      const shareTab = screen.getByText('Share');
      fireEvent.click(shareTab);
      
      const generateButton = screen.getByText(/Generate Shareable Link/i);
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        const newLinkButton = screen.getByText('Create New Link');
        fireEvent.click(newLinkButton);
        
        expect(screen.getByText(/Generate Shareable Link/i)).toBeInTheDocument();
      });
    });
  });

  describe('Notifications', () => {
    it('should show success notification', async () => {
      render(<ExportPanel {...defaultProps} />);
      
      const exportButton = screen.getByText(/Export PDF/i);
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Successfully exported as PDF/i)).toBeInTheDocument();
      });
    });

    it('should show error notification on export failure', async () => {
      const { exportService } = await import('../services/exportService');
      exportService.exportToPDF = vi.fn(() => Promise.reject(new Error('Export failed')));
      
      render(<ExportPanel {...defaultProps} />);
      
      const exportButton = screen.getByText(/Export PDF/i);
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Export failed/i)).toBeInTheDocument();
      });
    });

    it('should auto-hide notifications after timeout', async () => {
      vi.useFakeTimers();
      
      render(<ExportPanel {...defaultProps} />);
      
      const exportButton = screen.getByText(/Export PDF/i);
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Successfully exported as PDF/i)).toBeInTheDocument();
      });
      
      // Fast-forward time
      vi.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(screen.queryByText(/Successfully exported as PDF/i)).not.toBeInTheDocument();
      });
      
      vi.useRealTimers();
    });
  });
});