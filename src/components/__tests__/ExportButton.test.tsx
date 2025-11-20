import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExportButton } from '../ExportButton';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, className, whileHover, whileTap, title, ...props }: any) => (
      <button onClick={onClick} className={className} title={title} {...props}>
        {children}
      </button>
    )
  }
}));

// Mock ExportPanel
vi.mock('../ExportPanel', () => ({
  ExportPanel: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? (
      <div data-testid="export-panel">
        <button onClick={onClose} data-testid="close-panel">Close</button>
      </div>
    ) : null
  )
}));

describe('ExportButton', () => {
  it('should render export button', () => {
    render(<ExportButton />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Export & Share');
  });

  it('should have correct styling classes', () => {
    render(<ExportButton />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'fixed',
      'top-4',
      'right-4',
      'bg-purple-600',
      'hover:bg-purple-700',
      'text-white',
      'p-3',
      'rounded-full',
      'shadow-lg',
      'transition-colors',
      'z-30',
      'group'
    );
  });

  it('should show export panel when clicked', async () => {
    render(<ExportButton />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('export-panel')).toBeInTheDocument();
    });
  });

  it('should hide export panel when close is clicked', async () => {
    render(<ExportButton />);
    
    // Open panel
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByTestId('export-panel')).toBeInTheDocument();
    });

    // Close panel
    const closeButton = screen.getByTestId('close-panel');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('export-panel')).not.toBeInTheDocument();
    });
  });

  it('should display tooltip on hover', () => {
    render(<ExportButton />);
    
    const tooltip = screen.getByText('Export & Share');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveClass(
      'absolute',
      'right-full',
      'mr-2',
      'top-1/2',
      'transform',
      '-translate-y-1/2',
      'bg-gray-900',
      'text-white',
      'text-sm',
      'px-2',
      'py-1',
      'rounded',
      'opacity-0',
      'group-hover:opacity-100',
      'transition-opacity',
      'whitespace-nowrap'
    );
  });

  it('should contain download and share icons', () => {
    render(<ExportButton />);
    
    // Check if icons are rendered (we can't easily test Lucide icons directly)
    const button = screen.getByRole('button');
    const iconContainer = button.querySelector('.flex.items-center');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should be positioned as fixed element', () => {
    render(<ExportButton />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('fixed', 'top-4', 'right-4');
  });

  it('should have proper z-index for overlay', () => {
    render(<ExportButton />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('z-30');
  });

  it('should manage panel state correctly', async () => {
    render(<ExportButton />);
    
    const button = screen.getByRole('button');
    
    // Initially panel should not be visible
    expect(screen.queryByTestId('export-panel')).not.toBeInTheDocument();
    
    // Click to open
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByTestId('export-panel')).toBeInTheDocument();
    });
    
    // Click close to hide
    const closeButton = screen.getByTestId('close-panel');
    fireEvent.click(closeButton);
    await waitFor(() => {
      expect(screen.queryByTestId('export-panel')).not.toBeInTheDocument();
    });
  });
});