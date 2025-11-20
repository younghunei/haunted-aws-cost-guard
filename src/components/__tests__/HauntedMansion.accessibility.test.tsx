import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HauntedMansion } from '../HauntedMansion';
import { useHauntedStore } from '../../store/hauntedStore';

// Mock the store
vi.mock('../../store/hauntedStore');

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    header: ({ children, ...props }: any) => <header {...props}>{children}</header>,
    footer: ({ children, ...props }: any) => <footer {...props}>{children}</footer>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

// Mock react-konva
vi.mock('react-konva', () => ({
  Stage: ({ children, ...props }: any) => <div data-testid="konva-stage" {...props}>{children}</div>,
  Layer: ({ children, ...props }: any) => <div data-testid="konva-layer" {...props}>{children}</div>
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Ghost: () => <div data-testid="ghost-icon" />,
  Skull: () => <div data-testid="skull-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
  DollarSign: () => <div data-testid="dollar-icon" />,
  Activity: () => <div data-testid="activity-icon" />
}));

// Mock services
vi.mock('../../services/performanceMonitor', () => ({
  performanceMonitor: {
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
    getMetrics: vi.fn(() => ({ fps: 60, frameTime: 16.67, renderTime: 16.67, lastUpdate: Date.now() })),
    getQualitySettings: vi.fn(() => ({ level: 'high', particleCount: 20, animationSpeed: 1, shadowQuality: true, antiAliasing: true, maxEntities: 50 })),
    subscribe: vi.fn(() => vi.fn())
  }
}));

vi.mock('../../services/accessibilityService', () => ({
  accessibilityService: {
    generateMansionOverview: vi.fn(() => 'Mansion overview for screen readers'),
    announce: vi.fn(),
    generateServiceRoomDescription: vi.fn(() => ({
      label: 'Test service room',
      description: 'Test service description',
      role: 'button'
    }))
  }
}));

vi.mock('../../services/shareService', () => ({
  shareService: {
    extractShareIdFromUrl: vi.fn(() => null),
    isValidShareId: vi.fn(() => false),
    loadSharedState: vi.fn()
  }
}));

// Mock child components
vi.mock('../ServiceRoom', () => ({
  ServiceRoom: ({ service, onSelect, isSelected }: any) => (
    <div
      data-testid={`service-room-${service.service}`}
      role="button"
      tabIndex={0}
      aria-label={`${service.displayName} service room`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      style={{ border: isSelected ? '2px solid blue' : '1px solid gray' }}
    >
      {service.displayName} - ${service.totalCost}
    </div>
  )
}));

vi.mock('../CostDetailPanel', () => ({
  CostDetailPanel: ({ service, onClose }: any) => (
    <div data-testid="cost-detail-panel" role="dialog" aria-label="Cost details">
      <h2>{service.displayName} Details</h2>
      <button onClick={onClose} aria-label="Close details">Close</button>
    </div>
  )
}));

vi.mock('../BudgetPanel', () => ({
  BudgetPanel: () => <div data-testid="budget-panel" />
}));

vi.mock('../ExportButton', () => ({
  ExportButton: () => <button data-testid="export-button">Export</button>
}));

vi.mock('../LoadingStates', () => ({
  MansionSkeleton: () => <div data-testid="mansion-skeleton">Loading mansion...</div>
}));

const mockServices = [
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
  },
  {
    service: 's3',
    displayName: 'S3 Storage',
    totalCost: 340,
    currency: 'USD',
    budgetUtilization: 0.34,
    regions: [],
    tags: [],
    dailyCosts: [],
    trend: 'stable' as const
  }
];

const mockStore = {
  services: mockServices,
  selectedService: null,
  setSelectedService: vi.fn(),
  setShowBudgetPanel: vi.fn(),
  budgetNotifications: [],
  loadFromShareData: vi.fn(),
  shareData: null,
  isLoading: false
};

describe('HauntedMansion Accessibility & Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useHauntedStore as any).mockReturnValue(mockStore);
  });

  describe('Loading States', () => {
    it('should show loading skeleton when isLoading is true', () => {
      (useHauntedStore as any).mockReturnValue({
        ...mockStore,
        isLoading: true
      });

      render(<HauntedMansion />);
      
      expect(screen.getByTestId('mansion-skeleton')).toBeInTheDocument();
      expect(screen.getByText('Loading mansion...')).toBeInTheDocument();
    });

    it('should show mansion content when not loading', () => {
      render(<HauntedMansion />);
      
      expect(screen.queryByTestId('mansion-skeleton')).not.toBeInTheDocument();
      expect(screen.getByText('Haunted AWS Cost Guard')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA attributes on main container', () => {
      render(<HauntedMansion />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Haunted AWS Cost Guard Dashboard');
    });

    it('should have accessible service rooms', () => {
      render(<HauntedMansion />);
      
      const ec2Room = screen.getByTestId('service-room-ec2');
      expect(ec2Room).toHaveAttribute('role', 'button');
      expect(ec2Room).toHaveAttribute('tabIndex', '0');
      expect(ec2Room).toHaveAttribute('aria-label', 'EC2 Computing service room');
    });

    it('should have accessible budget management button', () => {
      render(<HauntedMansion />);
      
      const budgetButton = screen.getByRole('button', { name: /budget management/i });
      expect(budgetButton).toBeInTheDocument();
      expect(budgetButton).toHaveAttribute('aria-label', 'Budget Management');
    });

    it('should show alert count in budget button aria-label when there are notifications', () => {
      (useHauntedStore as any).mockReturnValue({
        ...mockStore,
        budgetNotifications: [
          { id: '1', acknowledged: false },
          { id: '2', acknowledged: false }
        ]
      });

      render(<HauntedMansion />);
      
      const budgetButton = screen.getByRole('button', { name: /budget management/i });
      expect(budgetButton).toHaveAttribute('aria-label', 'Budget Management (2 alerts)');
    });

    it('should have accessible status indicators', () => {
      render(<HauntedMansion />);
      
      expect(screen.getByRole('status', { name: 'Safe budget status' })).toBeInTheDocument();
      expect(screen.getByRole('status', { name: 'Warning budget status' })).toBeInTheDocument();
      expect(screen.getByRole('status', { name: 'Danger budget status' })).toBeInTheDocument();
    });

    it('should have screen reader only help text', () => {
      const { container } = render(<HauntedMansion />);
      
      const helpText = container.querySelector('.sr-only p');
      expect(helpText).toBeInTheDocument();
      expect(helpText).toHaveTextContent(/Use arrow keys to navigate/);
    });

    it('should have accessibility announcements area', () => {
      render(<HauntedMansion />);
      
      const announcements = document.getElementById('accessibility-announcements');
      expect(announcements).toBeInTheDocument();
      expect(announcements).toHaveAttribute('aria-live', 'polite');
      expect(announcements).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle Enter key to select service room', async () => {
      render(<HauntedMansion />);
      
      const ec2Room = screen.getByTestId('service-room-ec2');
      
      fireEvent.keyDown(ec2Room, { key: 'Enter' });
      
      expect(mockStore.setSelectedService).toHaveBeenCalledWith(mockServices[0]);
    });

    it('should handle Space key to select service room', async () => {
      render(<HauntedMansion />);
      
      const ec2Room = screen.getByTestId('service-room-ec2');
      
      fireEvent.keyDown(ec2Room, { key: ' ' });
      
      expect(mockStore.setSelectedService).toHaveBeenCalledWith(mockServices[0]);
    });

    it('should handle global keyboard shortcuts', () => {
      render(<HauntedMansion />);
      
      // Test 'b' key for budget panel
      fireEvent.keyDown(document, { key: 'b' });
      expect(mockStore.setShowBudgetPanel).toHaveBeenCalledWith(true);
      
      // Test 'B' key for budget panel
      fireEvent.keyDown(document, { key: 'B' });
      expect(mockStore.setShowBudgetPanel).toHaveBeenCalledWith(true);
    });

    it('should handle Escape key to close detail panel', () => {
      (useHauntedStore as any).mockReturnValue({
        ...mockStore,
        selectedService: mockServices[0]
      });

      render(<HauntedMansion />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(mockStore.setSelectedService).toHaveBeenCalledWith(null);
    });

    it('should handle arrow key navigation', () => {
      render(<HauntedMansion />);
      
      // Test arrow key navigation
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      fireEvent.keyDown(document, { key: 'ArrowUp' });
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      
      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('Performance Features', () => {
    it('should display performance metrics in footer', () => {
      render(<HauntedMansion />);
      
      expect(screen.getByText('FPS: 60')).toBeInTheDocument();
      expect(screen.getByText('Quality: high')).toBeInTheDocument();
    });

    it('should render without performance monitoring errors', () => {
      expect(() => {
        render(<HauntedMansion />);
      }).not.toThrow();
    });

    it('should handle component lifecycle properly', () => {
      const { unmount } = render(<HauntedMansion />);
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('should show activity icon in performance section', () => {
      render(<HauntedMansion />);
      
      expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
    });
  });

  describe('Service Room Interaction', () => {
    it('should select service room on click', () => {
      render(<HauntedMansion />);
      
      const ec2Room = screen.getByTestId('service-room-ec2');
      fireEvent.click(ec2Room);
      
      expect(mockStore.setSelectedService).toHaveBeenCalledWith(mockServices[0]);
    });

    it('should show detail panel when service is selected', () => {
      (useHauntedStore as any).mockReturnValue({
        ...mockStore,
        selectedService: mockServices[0]
      });

      render(<HauntedMansion />);
      
      expect(screen.getByTestId('cost-detail-panel')).toBeInTheDocument();
      expect(screen.getByText('EC2 Computing Details')).toBeInTheDocument();
    });

    it('should close detail panel when close button is clicked', () => {
      (useHauntedStore as any).mockReturnValue({
        ...mockStore,
        selectedService: mockServices[0]
      });

      render(<HauntedMansion />);
      
      const closeButton = screen.getByRole('button', { name: 'Close details' });
      fireEvent.click(closeButton);
      
      expect(mockStore.setSelectedService).toHaveBeenCalledWith(null);
    });
  });

  describe('Budget Management', () => {
    it('should open budget panel when button is clicked', () => {
      render(<HauntedMansion />);
      
      const budgetButton = screen.getByRole('button', { name: /budget management/i });
      fireEvent.click(budgetButton);
      
      expect(mockStore.setShowBudgetPanel).toHaveBeenCalledWith(true);
    });

    it('should show notification badge when there are unacknowledged alerts', () => {
      (useHauntedStore as any).mockReturnValue({
        ...mockStore,
        budgetNotifications: [
          { id: '1', acknowledged: false },
          { id: '2', acknowledged: false },
          { id: '3', acknowledged: true }
        ]
      });

      render(<HauntedMansion />);
      
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByLabelText('2 unacknowledged alerts')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have proper grid layout for service rooms', () => {
      render(<HauntedMansion />);
      
      const mansionContainer = screen.getByLabelText('Service rooms in haunted mansion');
      expect(mansionContainer).toHaveAttribute('role', 'grid');
    });

    it('should handle different screen sizes gracefully', () => {
      // Test that component renders without errors on different viewport sizes
      const { rerender } = render(<HauntedMansion />);
      
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });
      
      rerender(<HauntedMansion />);
      
      expect(screen.getByText('Haunted AWS Cost Guard')).toBeInTheDocument();
      
      // Simulate desktop viewport
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
      Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true });
      
      rerender(<HauntedMansion />);
      
      expect(screen.getByText('Haunted AWS Cost Guard')).toBeInTheDocument();
    });
  });
});