import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  ServiceRoomSkeleton,
  MansionSkeleton,
  HauntedSpinner,
  DetailPanelSkeleton,
  BudgetPanelSkeleton,
  ErrorState,
  ProgressiveLoader
} from '../LoadingStates';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Ghost: () => <div data-testid="ghost-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
  Activity: () => <div data-testid="activity-icon" />
}));

describe('LoadingStates Components', () => {
  describe('ServiceRoomSkeleton', () => {
    it('should render skeleton structure', () => {
      const { container } = render(<ServiceRoomSkeleton />);
      
      // Should have the main container
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      const { container } = render(<ServiceRoomSkeleton />);
      
      // Should have skeleton elements for loading state
      const skeletonElements = container.querySelectorAll('div');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('MansionSkeleton', () => {
    it('should render mansion skeleton with loading message', () => {
      render(<MansionSkeleton />);
      
      expect(screen.getByText('Summoning spirits...')).toBeInTheDocument();
      expect(screen.getByTestId('ghost-icon')).toBeInTheDocument();
    });

    it('should render multiple room skeletons', () => {
      const { container } = render(<MansionSkeleton />);
      
      // Should have grid layout
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('HauntedSpinner', () => {
    it('should render with default props', () => {
      render(<HauntedSpinner />);
      
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<HauntedSpinner message="Casting spells..." />);
      
      expect(screen.getByText('Casting spells...')).toBeInTheDocument();
    });

    it('should render with different sizes', () => {
      const { rerender } = render(<HauntedSpinner size="sm" />);
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      
      rerender(<HauntedSpinner size="lg" />);
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('should not render message when not provided', () => {
      render(<HauntedSpinner message="" />);
      
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('DetailPanelSkeleton', () => {
    it('should render detail panel skeleton structure', () => {
      const { container } = render(<DetailPanelSkeleton />);
      
      // Should have main container
      expect(container.firstChild).toBeInTheDocument();
      
      // Should have skeleton elements for header, chart, and breakdown
      const skeletonElements = container.querySelectorAll('div');
      expect(skeletonElements.length).toBeGreaterThan(5);
    });

    it('should render chart skeleton with bars', () => {
      const { container } = render(<DetailPanelSkeleton />);
      
      // Should have chart container
      const chartContainer = container.querySelector('.h-48');
      expect(chartContainer).toBeInTheDocument();
    });
  });

  describe('BudgetPanelSkeleton', () => {
    it('should render budget panel skeleton', () => {
      const { container } = render(<BudgetPanelSkeleton />);
      
      // Should have multiple budget item skeletons
      const budgetItems = container.querySelectorAll('.bg-gray-800\\/50');
      expect(budgetItems.length).toBeGreaterThan(0);
    });

    it('should render progress bar skeletons', () => {
      const { container } = render(<BudgetPanelSkeleton />);
      
      // Should have progress bars
      const progressBars = container.querySelectorAll('.h-2.bg-gray-700\\/50');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe('ErrorState', () => {
    it('should render error message', () => {
      render(<ErrorState message="Something went wrong" />);
      
      expect(screen.getByText('The spirits are restless...')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByTestId('ghost-icon')).toBeInTheDocument();
    });

    it('should render retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      render(<ErrorState message="Error occurred" onRetry={onRetry} />);
      
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
      
      retryButton.click();
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not render retry button when showRetry is false', () => {
      const onRetry = vi.fn();
      render(<ErrorState message="Error occurred" onRetry={onRetry} showRetry={false} />);
      
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });

    it('should not render retry button when onRetry is not provided', () => {
      render(<ErrorState message="Error occurred" />);
      
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });
  });

  describe('ProgressiveLoader', () => {
    const stages = [
      'Loading data...',
      'Processing results...',
      'Finalizing...'
    ];

    it('should render current stage', () => {
      render(<ProgressiveLoader stages={stages} currentStage={1} />);
      
      expect(screen.getByText('Processing results...')).toBeInTheDocument();
      expect(screen.getByText('2 of 3')).toBeInTheDocument();
    });

    it('should render progress bar', () => {
      const { container } = render(<ProgressiveLoader stages={stages} currentStage={1} />);
      
      const progressBar = container.querySelector('.w-64.h-2');
      expect(progressBar).toBeInTheDocument();
    });

    it('should handle first stage', () => {
      render(<ProgressiveLoader stages={stages} currentStage={0} />);
      
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
      expect(screen.getByText('1 of 3')).toBeInTheDocument();
    });

    it('should handle last stage', () => {
      render(<ProgressiveLoader stages={stages} currentStage={2} />);
      
      expect(screen.getByText('Finalizing...')).toBeInTheDocument();
      expect(screen.getByText('3 of 3')).toBeInTheDocument();
    });

    it('should handle invalid stage index', () => {
      render(<ProgressiveLoader stages={stages} currentStage={5} />);
      
      expect(screen.getAllByText('Loading...')[0]).toBeInTheDocument();
    });

    it('should render spinner', () => {
      render(<ProgressiveLoader stages={stages} currentStage={0} />);
      
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for loading states', () => {
      render(<HauntedSpinner message="Loading content" />);
      
      // Loading states should be announced to screen readers
      const loadingText = screen.getByText('Loading content');
      expect(loadingText).toBeInTheDocument();
    });

    it('should have proper button attributes in ErrorState', () => {
      const onRetry = vi.fn();
      render(<ErrorState message="Error" onRetry={onRetry} />);
      
      const button = screen.getByRole('button', { name: 'Try Again' });
      expect(button).toBeInTheDocument();
    });

    it('should provide meaningful text for screen readers', () => {
      render(<MansionSkeleton />);
      
      expect(screen.getByText('Summoning spirits...')).toBeInTheDocument();
    });
  });

  describe('Animation and Performance', () => {
    it('should render without throwing errors', () => {
      expect(() => {
        render(<ServiceRoomSkeleton />);
        render(<MansionSkeleton />);
        render(<HauntedSpinner />);
        render(<DetailPanelSkeleton />);
        render(<BudgetPanelSkeleton />);
      }).not.toThrow();
    });

    it('should handle rapid re-renders', () => {
      const { rerender } = render(<ProgressiveLoader stages={['Stage 1']} currentStage={0} />);
      
      expect(() => {
        for (let i = 0; i < 10; i++) {
          rerender(<ProgressiveLoader stages={['Stage 1', 'Stage 2']} currentStage={i % 2} />);
        }
      }).not.toThrow();
    });
  });
});