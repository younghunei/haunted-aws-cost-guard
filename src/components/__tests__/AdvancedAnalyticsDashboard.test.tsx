import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdvancedAnalyticsDashboard } from '../AdvancedAnalyticsDashboard';
import { useHauntedStore } from '../../store/hauntedStore';

// Mock the store
jest.mock('../../store/hauntedStore');
const mockUseHauntedStore = useHauntedStore as jest.MockedFunction<typeof useHauntedStore>;

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
}));

describe('AdvancedAnalyticsDashboard', () => {
  const mockStore = {
    monthlyCosts: [
      {
        month: '2024-11',
        year: 2024,
        cost: 7280.45,
        currency: 'USD',
        services: {
          'EC2': 2548.16,
          'S3': 1092.07,
          'RDS': 1820.11,
          'Lambda': 582.44,
          'CloudFront': 873.65,
          'DynamoDB': 364.02
        }
      }
    ],
    costForecast: {
      currentMonthCost: 7280.45,
      projectedMonthEndCost: 8733.34,
      confidence: 0.87,
      trend: 'increasing' as const,
      dailyProjections: [
        {
          date: '2024-11-01',
          projectedCost: 290.33,
          actualCost: 285.12
        }
      ]
    },
    regionalBreakdown: [
      {
        region: 'us-east-1',
        displayName: 'US East (N. Virginia)',
        totalCost: 5867.01,
        percentage: 80.47,
        services: [
          { service: 'EC2', cost: 2346.80, percentage: 40 },
          { service: 'S3', cost: 1173.40, percentage: 20 }
        ],
        trend: 'increasing' as const
      }
    ],
    isLoading: false,
    loadAdvancedCostData: jest.fn(),
    demoMode: true
  };

  beforeEach(() => {
    mockUseHauntedStore.mockReturnValue(mockStore as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('🎃 renders dashboard when open', () => {
    render(<AdvancedAnalyticsDashboard isOpen={true} onClose={jest.fn()} />);
    
    expect(screen.getByText(/고급 비용 분석 대시보드/)).toBeInTheDocument();
    expect(screen.getByText(/월별 비용/)).toBeInTheDocument();
    expect(screen.getByText(/비용 예측/)).toBeInTheDocument();
    expect(screen.getByText(/리전별 분석/)).toBeInTheDocument();
  });

  it('👻 does not render when closed', () => {
    render(<AdvancedAnalyticsDashboard isOpen={false} onClose={jest.fn()} />);
    
    expect(screen.queryByText(/고급 비용 분석 대시보드/)).not.toBeInTheDocument();
  });

  it('🦇 calls onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    render(<AdvancedAnalyticsDashboard isOpen={true} onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('📊 switches between tabs correctly', () => {
    render(<AdvancedAnalyticsDashboard isOpen={true} onClose={jest.fn()} />);
    
    // Default tab should be monthly
    expect(screen.getByText(/지난 6개월간의 비용 추이/)).toBeInTheDocument();
    
    // Click forecast tab
    const forecastTab = screen.getByText(/비용 예측/);
    fireEvent.click(forecastTab);
    
    expect(screen.getByText(/마법의 수정구가 예측하는 미래의 비용/)).toBeInTheDocument();
    
    // Click regional tab
    const regionalTab = screen.getByText(/리전별 분석/);
    fireEvent.click(regionalTab);
    
    expect(screen.getByText(/전 세계에 퍼진 으스스한 비용들/)).toBeInTheDocument();
  });

  it('🔄 calls refresh function when refresh button is clicked', async () => {
    render(<AdvancedAnalyticsDashboard isOpen={true} onClose={jest.fn()} />);
    
    const refreshButton = screen.getByText(/새로고침/);
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(mockStore.loadAdvancedCostData).toHaveBeenCalledTimes(1);
    });
  });

  it('⚡ shows loading state correctly', () => {
    mockUseHauntedStore.mockReturnValue({
      ...mockStore,
      isLoading: true
    } as any);

    render(<AdvancedAnalyticsDashboard isOpen={true} onClose={jest.fn()} />);
    
    expect(screen.getByText(/마법의 수정구가 데이터를 분석하고 있습니다/)).toBeInTheDocument();
  });

  it('🎭 shows demo mode indicator', () => {
    render(<AdvancedAnalyticsDashboard isOpen={true} onClose={jest.fn()} />);
    
    expect(screen.getByText(/데모 모드/)).toBeInTheDocument();
  });

  it('🔗 shows AWS mode indicator when not in demo mode', () => {
    mockUseHauntedStore.mockReturnValue({
      ...mockStore,
      demoMode: false
    } as any);

    render(<AdvancedAnalyticsDashboard isOpen={true} onClose={jest.fn()} />);
    
    expect(screen.getByText(/AWS 연결됨/)).toBeInTheDocument();
  });

  it('📈 loads data on mount when dashboard opens', () => {
    mockUseHauntedStore.mockReturnValue({
      ...mockStore,
      monthlyCosts: [], // Empty to trigger data load
      costForecast: null,
      regionalBreakdown: []
    } as any);

    render(<AdvancedAnalyticsDashboard isOpen={true} onClose={jest.fn()} />);
    
    expect(mockStore.loadAdvancedCostData).toHaveBeenCalledTimes(1);
  });

  it('🎃 displays Halloween themed elements', () => {
    render(<AdvancedAnalyticsDashboard isOpen={true} onClose={jest.fn()} />);
    
    // Check for Halloween emojis and themed text
    expect(screen.getByText(/🎃/)).toBeInTheDocument();
    expect(screen.getByText(/👻/)).toBeInTheDocument();
    expect(screen.getByText(/마법의 수정구/)).toBeInTheDocument();
  });

  it('⌨️ handles keyboard navigation', () => {
    const mockOnClose = jest.fn();
    render(<AdvancedAnalyticsDashboard isOpen={true} onClose={mockOnClose} />);
    
    // Test Escape key to close
    fireEvent.keyDown(document, { key: 'Escape' });
    // Note: This would need additional implementation in the component
    // to handle keyboard events at the document level
  });
});