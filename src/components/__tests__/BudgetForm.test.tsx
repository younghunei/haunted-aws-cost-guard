import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BudgetForm } from '../BudgetForm';
import { useHauntedStore } from '../../store/hauntedStore';

// Mock the store
vi.mock('../../store/hauntedStore');
const mockUseHauntedStore = useHauntedStore as any;

describe('BudgetForm', () => {
  const mockAddBudget = vi.fn();
  const mockUpdateBudget = vi.fn();
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  const existingBudget = {
    id: 'budget-1',
    accountId: 'demo',
    service: 'ec2',
    amount: 1500,
    currency: 'USD',
    period: 'monthly' as const,
    alertThresholds: [50, 80, 100],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseHauntedStore.mockReturnValue({
      addBudget: mockAddBudget,
      updateBudget: mockUpdateBudget,
      demoMode: true,
      // Add other required store properties
      services: [],
      selectedService: null,
      awsCredentials: null,
      isInitialized: true,
      lastUpdated: new Date(),
      budgets: [],
      budgetUtilizations: [],
      budgetNotifications: [],
      showBudgetPanel: false,
      setServices: vi.fn(),
      setSelectedService: vi.fn(),
      setMode: vi.fn(),
      setDemoMode: vi.fn(),
      refreshData: vi.fn(),
      initialize: vi.fn(),
      setBudgets: vi.fn(),
      deleteBudget: vi.fn(),
      setBudgetUtilizations: vi.fn(),
      setBudgetNotifications: vi.fn(),
      acknowledgeNotification: vi.fn(),
      setShowBudgetPanel: vi.fn(),
      loadBudgets: vi.fn(),
      calculateBudgetUtilizations: vi.fn()
    });
  });

  it('should render form for creating new budget', () => {
    render(
      <BudgetForm
        service="ec2"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Set Budget for EC2')).toBeInTheDocument();
    expect(screen.getByText('Create Budget')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument(); // Default amount
  });

  it('should render form for editing existing budget', () => {
    render(
      <BudgetForm
        service="ec2"
        existingBudget={existingBudget}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Edit Budget for EC2')).toBeInTheDocument();
    expect(screen.getByText('Update Budget')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1500')).toBeInTheDocument(); // Existing amount
  });

  it('should populate form with existing budget data', () => {
    render(
      <BudgetForm
        service="ec2"
        existingBudget={existingBudget}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('1500')).toBeInTheDocument();
    expect(screen.getByDisplayValue('USD')).toBeInTheDocument();
    expect(screen.getByDisplayValue('monthly')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    expect(screen.getByDisplayValue('80')).toBeInTheDocument();
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
  });

  it('should update form fields when changed', () => {
    render(
      <BudgetForm
        service="ec2"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const amountInput = screen.getByDisplayValue('1000');
    fireEvent.change(amountInput, { target: { value: '2000' } });
    expect(screen.getByDisplayValue('2000')).toBeInTheDocument();

    const currencySelect = screen.getByDisplayValue('USD');
    fireEvent.change(currencySelect, { target: { value: 'EUR' } });
    expect(screen.getByDisplayValue('EUR')).toBeInTheDocument();

    const periodSelect = screen.getByDisplayValue('monthly');
    fireEvent.change(periodSelect, { target: { value: 'quarterly' } });
    expect(screen.getByDisplayValue('quarterly')).toBeInTheDocument();
  });

  it('should update alert thresholds', () => {
    render(
      <BudgetForm
        service="ec2"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const warningInput = screen.getByDisplayValue('50');
    fireEvent.change(warningInput, { target: { value: '60' } });
    expect(screen.getByDisplayValue('60')).toBeInTheDocument();
  });

  it('should validate form and show errors', async () => {
    render(
      <BudgetForm
        service="ec2"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Set invalid amount
    const amountInput = screen.getByDisplayValue('1000');
    fireEvent.change(amountInput, { target: { value: '0' } });

    const submitButton = screen.getByText('Create Budget');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Budget amount must be greater than 0')).toBeInTheDocument();
    });

    expect(mockAddBudget).not.toHaveBeenCalled();
  });

  it('should validate alert thresholds order', async () => {
    render(
      <BudgetForm
        service="ec2"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    // Set invalid thresholds (not in ascending order)
    const warningInput = screen.getByDisplayValue('50');
    const criticalInput = screen.getByDisplayValue('80');
    
    fireEvent.change(warningInput, { target: { value: '90' } });
    fireEvent.change(criticalInput, { target: { value: '70' } });

    const submitButton = screen.getByText('Create Budget');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Alert thresholds must be in ascending order')).toBeInTheDocument();
    });

    expect(mockAddBudget).not.toHaveBeenCalled();
  });

  it('should create new budget when form is valid', async () => {
    mockAddBudget.mockResolvedValue(undefined);

    render(
      <BudgetForm
        service="ec2"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const amountInput = screen.getByDisplayValue('1000');
    fireEvent.change(amountInput, { target: { value: '2000' } });

    const submitButton = screen.getByText('Create Budget');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAddBudget).toHaveBeenCalledWith({
        accountId: 'demo',
        service: 'ec2',
        amount: 2000,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      });
    });

    expect(mockOnSave).toHaveBeenCalled();
  });

  it('should update existing budget when form is valid', async () => {
    mockUpdateBudget.mockResolvedValue(undefined);

    render(
      <BudgetForm
        service="ec2"
        existingBudget={existingBudget}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const amountInput = screen.getByDisplayValue('1500');
    fireEvent.change(amountInput, { target: { value: '2500' } });

    const submitButton = screen.getByText('Update Budget');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateBudget).toHaveBeenCalledWith({
        ...existingBudget,
        accountId: 'demo',
        service: 'ec2',
        amount: 2500,
        currency: 'USD',
        period: 'monthly',
        alertThresholds: [50, 80, 100]
      });
    });

    expect(mockOnSave).toHaveBeenCalled();
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(
      <BudgetForm
        service="ec2"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should disable submit button while submitting', async () => {
    mockAddBudget.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <BudgetForm
        service="ec2"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByText('Create Budget');
    fireEvent.click(submitButton);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should handle API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockAddBudget.mockRejectedValue(new Error('API Error'));

    render(
      <BudgetForm
        service="ec2"
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByText('Create Budget');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error saving budget:', expect.any(Error));
    });

    expect(mockOnSave).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});