import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BudgetPanel } from '../BudgetPanel';
import { useHauntedStore } from '../../store/hauntedStore';

// Mock the store
vi.mock('../../store/hauntedStore');
const mockUseHauntedStore = useHauntedStore as any;

// Mock child components
vi.mock('../BudgetForm', () => ({
  BudgetForm: ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <div data-testid="budget-form">
      <button onClick={onSave}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

vi.mock('../BudgetNotifications', () => ({
  BudgetNotifications: () => <div data-testid="budget-notifications">Notifications</div>
}));

describe('BudgetPanel', () => {
  const mockSetShowBudgetPanel = vi.fn();
  const mockDeleteBudget = vi.fn();

  const mockServices = [
    {
      service: 'ec2',
      displayName: 'EC2 Computing Chamber',
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
      displayName: 'S3',
      totalCost: 340,
      currency: 'USD',
      budgetUtilization: 0.34,
      regions: [],
      tags: [],
      dailyCosts: [],
      trend: 'stable' as const
    }
  ];

  const mockBudgets = [
    {
      id: 'budget-1',
      accountId: 'demo',
      service: 'ec2',
      amount: 1500,
      currency: 'USD',
      period: 'monthly' as const,
      alertThresholds: [50, 80, 100],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockBudgetUtilizations = [
    {
      service: 'ec2',
      currentCost: 1250,
      budgetAmount: 1500,
      utilizationPercentage: 83.33,
      alertLevel: 'critical' as const
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseHauntedStore.mockReturnValue({
      showBudgetPanel: true,
      setShowBudgetPanel: mockSetShowBudgetPanel,
      budgets: mockBudgets,
      budgetUtilizations: mockBudgetUtilizations,
      services: mockServices,
      deleteBudget: mockDeleteBudget,
      // Add other required store properties with default values
      selectedService: null,
      demoMode: true,
      awsCredentials: null,
      isInitialized: true,
      lastUpdated: new Date(),
      budgetNotifications: [],
      setServices: vi.fn(),
      setSelectedService: vi.fn(),
      setMode: vi.fn(),
      setDemoMode: vi.fn(),
      refreshData: vi.fn(),
      initialize: vi.fn(),
      setBudgets: vi.fn(),
      addBudget: vi.fn(),
      updateBudget: vi.fn(),
      setBudgetUtilizations: vi.fn(),
      setBudgetNotifications: vi.fn(),
      acknowledgeNotification: vi.fn(),
      loadBudgets: vi.fn(),
      calculateBudgetUtilizations: vi.fn()
    });
  });

  it('should not render when showBudgetPanel is false', () => {
    mockUseHauntedStore.mockReturnValue({
      ...mockUseHauntedStore(),
      showBudgetPanel: false
    });

    const { container } = render(<BudgetPanel />);
    expect(container.firstChild).toBeNull();
  });

  it('should render budget panel when showBudgetPanel is true', () => {
    render(<BudgetPanel />);
    
    expect(screen.getByText('💰 Budget Management')).toBeInTheDocument();
    expect(screen.getByText('Service Budgets')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('should close panel when close button is clicked', () => {
    render(<BudgetPanel />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockSetShowBudgetPanel).toHaveBeenCalledWith(false);
  });

  it('should switch between tabs', () => {
    render(<BudgetPanel />);
    
    const notificationsTab = screen.getByText('Notifications');
    fireEvent.click(notificationsTab);
    
    expect(screen.getByTestId('budget-notifications')).toBeInTheDocument();
  });

  it('should display service budget information', () => {
    render(<BudgetPanel />);
    
    expect(screen.getByText('EC2 Computing Chamber')).toBeInTheDocument();
    expect(screen.getByText('S3')).toBeInTheDocument();
    expect(screen.getByText('$1,250.00')).toBeInTheDocument();
    expect(screen.getByText('$340.00')).toBeInTheDocument();
  });

  it('should show budget utilization percentage', () => {
    render(<BudgetPanel />);
    
    expect(screen.getByText('83.3%')).toBeInTheDocument();
  });

  it('should show edit button for services with budgets', () => {
    render(<BudgetPanel />);
    
    const editButtons = screen.getAllByText('Edit');
    expect(editButtons).toHaveLength(1);
  });

  it('should show set budget button for services without budgets', () => {
    render(<BudgetPanel />);
    
    const setBudgetButtons = screen.getAllByText('Set Budget');
    expect(setBudgetButtons).toHaveLength(1);
  });

  it('should show budget form when editing', () => {
    render(<BudgetPanel />);
    
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);
    
    expect(screen.getByTestId('budget-form')).toBeInTheDocument();
  });

  it('should hide budget form when canceling', () => {
    render(<BudgetPanel />);
    
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(screen.queryByTestId('budget-form')).not.toBeInTheDocument();
  });

  it('should delete budget when delete button is clicked', async () => {
    window.confirm = vi.fn(() => true);
    
    render(<BudgetPanel />);
    
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(mockDeleteBudget).toHaveBeenCalledWith('budget-1');
    });
  });

  it('should not delete budget when confirmation is canceled', async () => {
    window.confirm = vi.fn(() => false);
    
    render(<BudgetPanel />);
    
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    
    expect(mockDeleteBudget).not.toHaveBeenCalled();
  });

  it('should display correct alert level colors', () => {
    render(<BudgetPanel />);
    
    const criticalBadge = screen.getByText('83.3%');
    expect(criticalBadge).toHaveClass('text-orange-600');
  });

  it('should show budget progress bar', () => {
    render(<BudgetPanel />);
    
    expect(screen.getByText('Budget Utilization')).toBeInTheDocument();
  });
});