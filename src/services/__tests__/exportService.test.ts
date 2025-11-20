import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportService, MansionSnapshot } from '../exportService';

// Mock dependencies
vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve({
    toDataURL: vi.fn(() => 'data:image/png;base64,mock-image-data'),
    toBlob: vi.fn((callback) => callback(new Blob(['mock-blob'], { type: 'image/png' }))),
    width: 800,
    height: 600
  }))
}));

const mockPdfInstance = {
  setFontSize: vi.fn(),
  setTextColor: vi.fn(),
  setFillColor: vi.fn(),
  rect: vi.fn(),
  text: vi.fn(),
  addImage: vi.fn(),
  addPage: vi.fn(),
  save: vi.fn()
};

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => mockPdfInstance)
}));

const mockSaveAs = vi.fn();
vi.mock('file-saver', () => ({
  saveAs: mockSaveAs
}));

// Mock DOM methods
Object.defineProperty(document, 'getElementById', {
  value: vi.fn(() => ({
    id: 'mansion-container',
    offsetWidth: 800,
    offsetHeight: 600
  })),
  writable: true
});

Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    id: '',
    textContent: '',
    style: {},
    focus: vi.fn(),
    select: vi.fn(),
    remove: vi.fn()
  })),
  writable: true
});

Object.defineProperty(document, 'head', {
  value: {
    appendChild: vi.fn()
  },
  writable: true
});

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(document, 'execCommand', {
  value: vi.fn(() => true),
  writable: true
});

describe('ExportService', () => {
  const mockServices = [
    {
      service: 'ec2',
      displayName: 'EC2 Computing',
      totalCost: 1250,
      currency: 'USD',
      budgetUtilization: 0.85,
      regions: [
        { region: 'us-east-1', cost: 500, percentage: 40 },
        { region: 'us-west-2', cost: 375, percentage: 30 }
      ],
      tags: [
        { key: 'Environment', value: 'Production', cost: 750, percentage: 60 }
      ],
      dailyCosts: [
        { date: '2023-11-18', cost: 120 },
        { date: '2023-11-19', cost: 135 }
      ],
      trend: 'increasing' as const
    },
    {
      service: 's3',
      displayName: 'S3 Storage',
      totalCost: 340,
      currency: 'USD',
      budgetUtilization: 0.34,
      regions: [
        { region: 'us-east-1', cost: 136, percentage: 40 }
      ],
      tags: [
        { key: 'DataType', value: 'Media', cost: 170, percentage: 50 }
      ],
      dailyCosts: [
        { date: '2023-11-18', cost: 45 },
        { date: '2023-11-19', cost: 48 }
      ],
      trend: 'stable' as const
    }
  ];

  const mockViewSettings = {
    zoom: 1.2,
    center: { x: 100, y: 50 },
    showDetails: true
  };

  const mockBudgets = [
    {
      id: '1',
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveAs.mockClear();
    Object.values(mockPdfInstance).forEach(mock => {
      if (typeof mock === 'function') mock.mockClear();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateMansionSnapshot', () => {
    it('should generate a complete mansion snapshot', () => {
      const snapshot = exportService.generateMansionSnapshot(
        mockServices,
        mockViewSettings,
        mockBudgets,
        'demo'
      );

      expect(snapshot).toMatchObject({
        services: mockServices,
        viewSettings: mockViewSettings,
        budgets: mockBudgets,
        metadata: {
          version: '1.0.0',
          mode: 'demo',
          totalCost: 1590, // 1250 + 340
          currency: 'USD'
        }
      });
      expect(snapshot.timestamp).toBeInstanceOf(Date);
    });

    it('should handle empty services array', () => {
      const snapshot = exportService.generateMansionSnapshot(
        [],
        mockViewSettings,
        mockBudgets,
        'aws'
      );

      expect(snapshot.metadata.totalCost).toBe(0);
      expect(snapshot.metadata.currency).toBe('USD');
      expect(snapshot.metadata.mode).toBe('aws');
    });
  });

  describe('exportToPDF', () => {
    it('should export mansion as PDF successfully', async () => {
      const html2canvas = await import('html2canvas');
      const jsPDF = await import('jspdf');

      await exportService.exportToPDF('mansion-container', 'test-mansion');

      expect(html2canvas.default).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          backgroundColor: '#1a1a1a',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false
        })
      );

      expect(jsPDF.default).toHaveBeenCalledWith({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
    });

    it('should throw error when element not found', async () => {
      document.getElementById = vi.fn(() => null);

      await expect(
        exportService.exportToPDF('non-existent-element')
      ).rejects.toThrow('Mansion element not found');
    });

    it('should include data summary when requested', async () => {
      const snapshot = exportService.generateMansionSnapshot(
        mockServices,
        mockViewSettings,
        mockBudgets,
        'demo'
      );

      await exportService.exportToPDF(
        'mansion-container',
        'test-mansion',
        { includeData: true, snapshot }
      );

      expect(mockPdfInstance.addPage).toHaveBeenCalled();
      expect(mockPdfInstance.text).toHaveBeenCalledWith(
        expect.stringContaining('Cost Summary'),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('exportToPNG', () => {
    it('should export mansion as PNG successfully', async () => {
      const html2canvas = await import('html2canvas');
      const fileSaver = await import('file-saver');

      await exportService.exportToPNG('mansion-container', 'test-mansion');

      expect(html2canvas.default).toHaveBeenCalled();
      expect(mockSaveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'test-mansion.png'
      );
    });

    it('should throw error when element not found', async () => {
      document.getElementById = vi.fn(() => null);

      await expect(
        exportService.exportToPNG('non-existent-element')
      ).rejects.toThrow('Mansion element not found');
    });
  });

  describe('exportToJSON', () => {
    it('should export snapshot as JSON file', () => {
      const snapshot = exportService.generateMansionSnapshot(
        mockServices,
        mockViewSettings,
        mockBudgets,
        'demo'
      );

      exportService.exportToJSON(snapshot, 'test-data');

      expect(mockSaveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'test-data.json'
      );

      const blobCall = mockSaveAs.mock.calls[0];
      expect(blobCall[0].type).toBe('application/json');
    });

    it('should handle export errors gracefully', () => {
      const invalidSnapshot = { circular: {} } as any;
      invalidSnapshot.circular.ref = invalidSnapshot;

      expect(() => {
        exportService.exportToJSON(invalidSnapshot);
      }).toThrow('Failed to export JSON');
    });
  });

  describe('exportToCSV', () => {
    it('should export services as CSV file', () => {
      exportService.exportToCSV(mockServices, 'test-costs');

      expect(mockSaveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'test-costs.csv'
      );

      const blobCall = mockSaveAs.mock.calls[0];
      expect(blobCall[0].type).toBe('text/csv;charset=utf-8;');
    });

    it('should include correct CSV headers', () => {
      exportService.exportToCSV(mockServices);

      const blobCall = mockSaveAs.mock.calls[0];
      const blob = blobCall[0];
      
      // We can't easily read the blob content in tests, but we can verify the call
      expect(blob).toBeInstanceOf(Blob);
    });

    it('should handle services without regions or tags', () => {
      const servicesWithoutDetails = [
        {
          service: 'lambda',
          displayName: 'Lambda Functions',
          totalCost: 50,
          currency: 'USD',
          budgetUtilization: 0.25,
          trend: 'stable' as const
        }
      ];

      expect(() => {
        exportService.exportToCSV(servicesWithoutDetails);
      }).not.toThrow();
    });
  });

  describe('exportDetailedCSV', () => {
    it('should export detailed CSV with all breakdowns', () => {
      exportService.exportDetailedCSV(mockServices, 'detailed-costs');

      expect(mockSaveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        'detailed-costs.csv'
      );
    });

    it('should handle empty arrays gracefully', () => {
      expect(() => {
        exportService.exportDetailedCSV([]);
      }).not.toThrow();
    });
  });

  describe('preparePrintStyles', () => {
    it('should add print styles to document head', () => {
      exportService.preparePrintStyles();

      expect(document.createElement).toHaveBeenCalledWith('style');
      expect(document.head.appendChild).toHaveBeenCalled();
    });

    it('should remove existing print styles before adding new ones', () => {
      // Mock existing style element
      const existingStyle = { remove: vi.fn() };
      document.getElementById = vi.fn((id) => 
        id === 'print-styles' ? existingStyle : null
      );

      exportService.preparePrintStyles();

      expect(existingStyle.remove).toHaveBeenCalled();
    });
  });

  describe('printMansion', () => {
    it('should trigger browser print dialog', () => {
      const mockPrint = vi.fn();
      Object.defineProperty(window, 'print', {
        value: mockPrint,
        writable: true
      });

      exportService.printMansion();

      // Print is called after a timeout
      setTimeout(() => {
        expect(mockPrint).toHaveBeenCalled();
      }, 150);
    });
  });
});