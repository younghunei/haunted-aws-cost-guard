import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ModeSelection } from '../ModeSelection';

// Mock fetch for testing
global.fetch = vi.fn();

describe('ModeSelection Component', () => {
  const mockOnModeSelect = vi.fn();

  beforeEach(() => {
    mockOnModeSelect.mockClear();
    vi.mocked(fetch).mockClear();
  });

  it('renders mode selection interface', () => {
    render(<ModeSelection onModeSelect={mockOnModeSelect} />);

    expect(screen.getByText('🏚️ Haunted AWS Cost Guard')).toBeInTheDocument();
    expect(screen.getByText('Demo Mode')).toBeInTheDocument();
    expect(screen.getByText('AWS Account')).toBeInTheDocument();
  });

  it('calls onModeSelect immediately when demo mode is selected', () => {
    render(<ModeSelection onModeSelect={mockOnModeSelect} />);

    const demoCard = screen.getByText('Demo Mode').closest('div');
    fireEvent.click(demoCard!);

    expect(mockOnModeSelect).toHaveBeenCalledWith('demo');
  });

  it('shows credential form when AWS mode is selected', () => {
    render(<ModeSelection onModeSelect={mockOnModeSelect} />);

    const awsCard = screen.getByText('AWS Account').closest('div');
    fireEvent.click(awsCard!);

    expect(screen.getByText('AWS Credentials')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('AKIA...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your secret access key')).toBeInTheDocument();
  });

  it('validates required fields before credential validation', async () => {
    render(<ModeSelection onModeSelect={mockOnModeSelect} />);

    // Select AWS mode
    const awsCard = screen.getByText('AWS Account').closest('div');
    fireEvent.click(awsCard!);

    // Try to validate without credentials
    const validateButton = screen.getByText('Validate Credentials');
    expect(validateButton).toBeDisabled();
  });

  it('shows validation error for invalid credentials', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: 'Invalid AWS credentials'
      })
    });

    render(<ModeSelection onModeSelect={mockOnModeSelect} />);

    // Select AWS mode
    const awsCard = screen.getByText('AWS Account').closest('div');
    fireEvent.click(awsCard!);

    // Fill in credentials
    const accessKeyInput = screen.getByPlaceholderText('AKIA...');
    const secretKeyInput = screen.getByPlaceholderText('Enter your secret access key');
    
    fireEvent.change(accessKeyInput, { target: { value: 'INVALID_KEY' } });
    fireEvent.change(secretKeyInput, { target: { value: 'invalid_secret' } });

    // Validate credentials
    const validateButton = screen.getByText('Validate Credentials');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid AWS credentials')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/cost/validate-credentials',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKeyId: 'INVALID_KEY',
          secretAccessKey: 'invalid_secret',
          region: 'us-east-1'
        })
      })
    );
  });

  it('shows success message and enables proceed button for valid credentials', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: { valid: true }
      })
    });

    render(<ModeSelection onModeSelect={mockOnModeSelect} />);

    // Select AWS mode
    const awsCard = screen.getByText('AWS Account').closest('div');
    fireEvent.click(awsCard!);

    // Fill in credentials
    const accessKeyInput = screen.getByPlaceholderText('AKIA...');
    const secretKeyInput = screen.getByPlaceholderText('Enter your secret access key');
    
    fireEvent.change(accessKeyInput, { target: { value: 'VALID_KEY' } });
    fireEvent.change(secretKeyInput, { target: { value: 'valid_secret' } });

    // Validate credentials
    const validateButton = screen.getByText('Validate Credentials');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText('Credentials validated successfully!')).toBeInTheDocument();
    });

    // Proceed button should be enabled
    const proceedButton = screen.getByText('Enter the Mansion');
    expect(proceedButton).not.toBeDisabled();

    // Click proceed
    fireEvent.click(proceedButton);

    expect(mockOnModeSelect).toHaveBeenCalledWith('aws', {
      accessKeyId: 'VALID_KEY',
      secretAccessKey: 'valid_secret',
      region: 'us-east-1'
    });
  });

  it('handles network errors gracefully', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    render(<ModeSelection onModeSelect={mockOnModeSelect} />);

    // Select AWS mode and fill credentials
    const awsCard = screen.getByText('AWS Account').closest('div');
    fireEvent.click(awsCard!);

    const accessKeyInput = screen.getByPlaceholderText('AKIA...');
    const secretKeyInput = screen.getByPlaceholderText('Enter your secret access key');
    
    fireEvent.change(accessKeyInput, { target: { value: 'VALID_KEY' } });
    fireEvent.change(secretKeyInput, { target: { value: 'valid_secret' } });

    // Validate credentials
    const validateButton = screen.getByText('Validate Credentials');
    fireEvent.click(validateButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to validate credentials/)).toBeInTheDocument();
    });
  });

  it('updates region selection correctly', () => {
    render(<ModeSelection onModeSelect={mockOnModeSelect} />);

    // Select AWS mode
    const awsCard = screen.getByText('AWS Account').closest('div');
    fireEvent.click(awsCard!);

    // Change region
    const regionSelect = screen.getByDisplayValue('US East (N. Virginia)');
    fireEvent.change(regionSelect, { target: { value: 'us-west-2' } });

    expect(regionSelect).toHaveValue('us-west-2');
  });
});