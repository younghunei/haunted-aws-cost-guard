import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

export interface ExportOptions {
  format: 'pdf' | 'png' | 'json' | 'csv';
  includeVisual: boolean;
  includeData: boolean;
  filename?: string;
}

export interface MansionSnapshot {
  timestamp: Date;
  services: any[];
  viewSettings: {
    zoom: number;
    center: { x: number; y: number };
    showDetails: boolean;
  };
  budgets?: any[];
  metadata: {
    version: string;
    mode: 'demo' | 'aws';
    totalCost: number;
    currency: string;
  };
}

class ExportService {
  /**
   * Generate a snapshot of the current mansion state
   */
  generateMansionSnapshot(
    services: any[],
    viewSettings: any,
    budgets?: any[],
    mode: 'demo' | 'aws' = 'demo'
  ): MansionSnapshot {
    const totalCost = services.reduce((sum, service) => sum + service.totalCost, 0);
    
    return {
      timestamp: new Date(),
      services,
      viewSettings,
      budgets,
      metadata: {
        version: '1.0.0',
        mode,
        totalCost,
        currency: services[0]?.currency || 'USD'
      }
    };
  }

  /**
   * Export mansion visual as PDF
   */
  async exportToPDF(
    elementId: string,
    filename: string = 'haunted-mansion-report',
    options: { includeData?: boolean; snapshot?: MansionSnapshot } = {}
  ): Promise<void> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Mansion element not found');
      }

      // Capture the mansion visual
      const canvas = await html2canvas(element, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(255, 255, 255);
      pdf.setFillColor(26, 26, 26);
      pdf.rect(0, 0, 297, 210, 'F');
      pdf.text('Haunted AWS Cost Guard Report', 20, 20);

      // Add timestamp
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);

      // Add mansion image
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 250;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 40, imgWidth, Math.min(imgHeight, 140));

      // Add data summary if requested
      if (options.includeData && options.snapshot) {
        pdf.addPage();
        this.addDataSummaryToPDF(pdf, options.snapshot);
      }

      // Save PDF
      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('Failed to export PDF');
    }
  }

  /**
   * Export mansion visual as PNG
   */
  async exportToPNG(
    elementId: string,
    filename: string = 'haunted-mansion'
  ): Promise<void> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Mansion element not found');
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `${filename}.png`);
        }
      });
    } catch (error) {
      console.error('Error exporting to PNG:', error);
      throw new Error('Failed to export PNG');
    }
  }

  /**
   * Export data as JSON
   */
  exportToJSON(snapshot: MansionSnapshot, filename: string = 'mansion-data'): void {
    try {
      const dataStr = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      saveAs(blob, `${filename}.json`);
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      throw new Error('Failed to export JSON');
    }
  }

  /**
   * Export cost data as CSV
   */
  exportToCSV(services: any[], filename: string = 'cost-data'): void {
    try {
      const headers = [
        'Service',
        'Display Name',
        'Total Cost',
        'Currency',
        'Budget Utilization (%)',
        'Trend',
        'Top Region',
        'Top Region Cost',
        'Daily Average'
      ];

      const rows = services.map(service => {
        const topRegion = service.regions?.reduce((max: any, region: any) => 
          region.cost > (max?.cost || 0) ? region : max, null);
        
        const dailyAverage = service.dailyCosts?.length > 0 
          ? service.dailyCosts.reduce((sum: number, day: any) => sum + day.cost, 0) / service.dailyCosts.length
          : 0;

        return [
          service.service,
          service.displayName,
          service.totalCost,
          service.currency,
          (service.budgetUtilization * 100).toFixed(2),
          service.trend,
          topRegion?.region || 'N/A',
          topRegion?.cost || 0,
          dailyAverage.toFixed(2)
        ];
      });

      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${filename}.csv`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('Failed to export CSV');
    }
  }

  /**
   * Export detailed cost breakdown as CSV
   */
  exportDetailedCSV(services: any[], filename: string = 'detailed-cost-data'): void {
    try {
      const rows: string[][] = [];
      
      // Headers
      rows.push([
        'Service',
        'Display Name',
        'Total Cost',
        'Currency',
        'Budget Utilization (%)',
        'Trend',
        'Region',
        'Region Cost',
        'Region Percentage',
        'Tag Key',
        'Tag Value',
        'Tag Cost',
        'Tag Percentage',
        'Date',
        'Daily Cost'
      ]);

      services.forEach(service => {
        // Base service info
        const baseInfo = [
          service.service,
          service.displayName,
          service.totalCost.toString(),
          service.currency,
          (service.budgetUtilization * 100).toFixed(2),
          service.trend
        ];

        // Add regional breakdown
        if (service.regions?.length > 0) {
          service.regions.forEach((region: any) => {
            rows.push([
              ...baseInfo,
              region.region,
              region.cost.toString(),
              region.percentage.toString(),
              '', '', '', '', '', ''
            ]);
          });
        }

        // Add tag breakdown
        if (service.tags?.length > 0) {
          service.tags.forEach((tag: any) => {
            rows.push([
              ...baseInfo,
              '', '', '',
              tag.key,
              tag.value,
              tag.cost.toString(),
              tag.percentage.toString(),
              '', ''
            ]);
          });
        }

        // Add daily costs
        if (service.dailyCosts?.length > 0) {
          service.dailyCosts.forEach((daily: any) => {
            rows.push([
              ...baseInfo,
              '', '', '', '', '', '', '',
              daily.date,
              daily.cost.toString()
            ]);
          });
        }
      });

      const csvContent = rows
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${filename}.csv`);
    } catch (error) {
      console.error('Error exporting detailed CSV:', error);
      throw new Error('Failed to export detailed CSV');
    }
  }

  /**
   * Add data summary to PDF
   */
  private addDataSummaryToPDF(pdf: jsPDF, snapshot: MansionSnapshot): void {
    let yPosition = 20;
    
    // Title
    pdf.setFontSize(16);
    pdf.text('Cost Summary', 20, yPosition);
    yPosition += 15;

    // Metadata
    pdf.setFontSize(12);
    pdf.text(`Total Cost: ${snapshot.metadata.totalCost.toFixed(2)} ${snapshot.metadata.currency}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Mode: ${snapshot.metadata.mode.toUpperCase()}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Services: ${snapshot.services.length}`, 20, yPosition);
    yPosition += 15;

    // Service breakdown
    pdf.setFontSize(14);
    pdf.text('Service Breakdown:', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    snapshot.services.forEach((service, index) => {
      if (yPosition > 280) {
        pdf.addPage();
        yPosition = 20;
      }

      const utilizationColor = service.budgetUtilization > 1 ? [255, 0, 0] : 
                              service.budgetUtilization > 0.8 ? [255, 165, 0] : [0, 255, 0];
      
      pdf.setTextColor(...utilizationColor);
      pdf.text(
        `${service.displayName}: ${service.totalCost.toFixed(2)} ${service.currency} (${(service.budgetUtilization * 100).toFixed(1)}%)`,
        25, yPosition
      );
      yPosition += 6;
    });
  }

  /**
   * Prepare print-friendly styles
   */
  preparePrintStyles(): void {
    const printStyles = `
      @media print {
        body * {
          visibility: hidden;
        }
        
        .mansion-container, .mansion-container * {
          visibility: visible;
        }
        
        .mansion-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100% !important;
          height: 100% !important;
          background: white !important;
        }
        
        .export-panel,
        .cost-detail-panel,
        .budget-panel,
        .mode-selection {
          display: none !important;
        }
        
        .service-room {
          border: 2px solid #333 !important;
          background: white !important;
        }
        
        .supernatural-entity {
          opacity: 0.8 !important;
        }
        
        .room-label {
          color: #000 !important;
          font-weight: bold !important;
        }
      }
    `;

    // Remove existing print styles
    const existingStyle = document.getElementById('print-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Add new print styles
    const styleElement = document.createElement('style');
    styleElement.id = 'print-styles';
    styleElement.textContent = printStyles;
    document.head.appendChild(styleElement);
  }

  /**
   * Trigger browser print dialog
   */
  printMansion(): void {
    this.preparePrintStyles();
    
    // Small delay to ensure styles are applied
    setTimeout(() => {
      window.print();
    }, 100);
  }
}

export const exportService = new ExportService();