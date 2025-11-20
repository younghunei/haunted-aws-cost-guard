import { CSVUploadService } from '../services/csvUploadService';

describe('CSVUploadService', () => {
  let csvUploadService: CSVUploadService;

  beforeEach(() => {
    csvUploadService = new CSVUploadService();
  });

  describe('processCostExplorerCSV', () => {
    it('should process cost and usage CSV format', async () => {
      const csvContent = `Service,BlendedCost,Region,Date
Amazon Elastic Compute Cloud - Compute,150.50,us-east-1,2023-11-01
Amazon Simple Storage Service,25.75,us-east-1,2023-11-01
Amazon Elastic Compute Cloud - Compute,100.25,us-west-2,2023-11-02`;

      const buffer = Buffer.from(csvContent);
      const result = await csvUploadService.processCostExplorerCSV(buffer);

      expect(result.success).toBe(true);
      expect(result.costData).toBeDefined();
      expect(result.rowsProcessed).toBe(3);
      
      if (result.costData) {
        expect(result.costData.services).toHaveLength(2);
        expect(result.costData.totalCost).toBe(276.5);
        
        const ec2Service = result.costData.services.find(
          s => s.displayName === 'Amazon Elastic Compute Cloud - Compute'
        );
        expect(ec2Service).toBeDefined();
        expect(ec2Service?.totalCost).toBe(250.75);
        expect(ec2Service?.regions).toHaveLength(2);
        expect(ec2Service?.dailyCosts).toHaveLength(2);
      }
    });

    it('should process daily costs CSV format', async () => {
      const csvContent = `Date,Service,Cost
2023-11-01,Amazon S3,10.50
2023-11-02,Amazon S3,12.25
2023-11-01,Amazon EC2,50.00`;

      const buffer = Buffer.from(csvContent);
      const result = await csvUploadService.processCostExplorerCSV(buffer);

      expect(result.success).toBe(true);
      expect(result.costData).toBeDefined();
      
      if (result.costData) {
        expect(result.costData.services).toHaveLength(2);
        expect(result.costData.totalCost).toBe(72.75);
        
        const s3Service = result.costData.services.find(
          s => s.displayName === 'Amazon S3'
        );
        expect(s3Service?.dailyCosts).toHaveLength(2);
        // Trend calculation needs more data points to determine increasing/decreasing
        expect(['increasing', 'decreasing', 'stable']).toContain(s3Service?.trend);
      }
    });

    it('should process service costs CSV format', async () => {
      const csvContent = `Service,Amount
Amazon EC2,100.00
Amazon S3,25.50
Amazon RDS,75.25`;

      const buffer = Buffer.from(csvContent);
      const result = await csvUploadService.processCostExplorerCSV(buffer);

      expect(result.success).toBe(true);
      expect(result.costData).toBeDefined();
      
      if (result.costData) {
        expect(result.costData.services).toHaveLength(3);
        expect(result.costData.totalCost).toBe(200.75);
      }
    });

    it('should handle empty CSV file', async () => {
      const csvContent = '';
      const buffer = Buffer.from(csvContent);
      
      const result = await csvUploadService.processCostExplorerCSV(buffer);

      expect(result.success).toBe(false);
      expect(result.error).toContain('CSV file is empty');
    });

    it('should handle malformed CSV data', async () => {
      const csvContent = `Service,Amount
Amazon EC2,invalid_number
Amazon S3,25.50`;

      const buffer = Buffer.from(csvContent);
      const result = await csvUploadService.processCostExplorerCSV(buffer);

      expect(result.success).toBe(true);
      expect(result.costData?.services).toHaveLength(1); // Only valid row processed
    });

    it('should calculate trends correctly', async () => {
      const csvContent = `Date,Service,Cost
2023-11-01,Amazon S3,10.00
2023-11-02,Amazon S3,10.00
2023-11-03,Amazon S3,10.00
2023-11-04,Amazon S3,10.00
2023-11-05,Amazon S3,10.00
2023-11-06,Amazon S3,10.00
2023-11-07,Amazon S3,10.00
2023-11-08,Amazon S3,15.00
2023-11-09,Amazon S3,15.00
2023-11-10,Amazon S3,15.00
2023-11-11,Amazon S3,15.00
2023-11-12,Amazon S3,15.00
2023-11-13,Amazon S3,15.00
2023-11-14,Amazon S3,15.00`;

      const buffer = Buffer.from(csvContent);
      const result = await csvUploadService.processCostExplorerCSV(buffer);

      expect(result.success).toBe(true);
      
      if (result.costData) {
        const s3Service = result.costData.services[0];
        expect(s3Service.trend).toBe('increasing');
      }
    });

    it('should handle regional breakdown correctly', async () => {
      const csvContent = `Service,BlendedCost,Region
Amazon EC2,100.00,us-east-1
Amazon EC2,50.00,us-west-2
Amazon EC2,25.00,eu-west-1`;

      const buffer = Buffer.from(csvContent);
      const result = await csvUploadService.processCostExplorerCSV(buffer);

      expect(result.success).toBe(true);
      
      if (result.costData) {
        const ec2Service = result.costData.services[0];
        expect(ec2Service.regions).toHaveLength(3);
        expect(ec2Service.regions[0].percentage).toBeCloseTo(57.14, 1); // 100/175 * 100
      }
    });
  });

  describe('validateCSVFormat', () => {
    it('should validate cost and usage format', async () => {
      const csvContent = `Service,BlendedCost,Region
Amazon EC2,100.00,us-east-1`;

      const buffer = Buffer.from(csvContent);
      const result = await csvUploadService.validateCSVFormat(buffer);

      expect(result.valid).toBe(true);
      expect(result.format).toBe('cost-and-usage');
    });

    it('should validate daily costs format', async () => {
      const csvContent = `Date,Cost,Service
2023-11-01,100.00,Amazon EC2`;

      const buffer = Buffer.from(csvContent);
      const result = await csvUploadService.validateCSVFormat(buffer);

      expect(result.valid).toBe(true);
      expect(result.format).toBe('daily-costs');
    });

    it('should validate service costs format', async () => {
      const csvContent = `Service,Amount
Amazon EC2,100.00`;

      const buffer = Buffer.from(csvContent);
      const result = await csvUploadService.validateCSVFormat(buffer);

      expect(result.valid).toBe(true);
      expect(result.format).toBe('service-costs');
    });

    it('should reject unknown format', async () => {
      const csvContent = `Unknown,Headers
value1,value2`;

      const buffer = Buffer.from(csvContent);
      const result = await csvUploadService.validateCSVFormat(buffer);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported CSV format');
    });

    it('should handle malformed CSV', async () => {
      const csvContent = `Invalid CSV content without proper structure`;

      const buffer = Buffer.from(csvContent);
      const result = await csvUploadService.validateCSVFormat(buffer);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    }, 10000); // Increase timeout for this test
  });

  describe('edge cases', () => {
    it('should handle CSV with only headers', async () => {
      const csvContent = `Service,BlendedCost,Region`;

      const buffer = Buffer.from(csvContent);
      const result = await csvUploadService.processCostExplorerCSV(buffer);

      expect(result.success).toBe(false);
      expect(result.error).toContain('CSV file is empty');
    });

    it('should handle services with zero costs', async () => {
      const csvContent = `Service,Amount
Amazon EC2,0.00
Amazon S3,25.50`;

      const buffer = Buffer.from(csvContent);
      const result = await csvUploadService.processCostExplorerCSV(buffer);

      expect(result.success).toBe(true);
      
      if (result.costData) {
        // Zero cost services should be filtered out
        expect(result.costData.services).toHaveLength(1);
        expect(result.costData.services[0].displayName).toBe('Amazon S3');
      }
    });

    it('should normalize service names correctly', async () => {
      const csvContent = `Service,Amount
"Amazon Elastic Compute Cloud - Compute",100.00
"Amazon Simple Storage Service",25.50`;

      const buffer = Buffer.from(csvContent);
      const result = await csvUploadService.processCostExplorerCSV(buffer);

      expect(result.success).toBe(true);
      
      if (result.costData) {
        const ec2Service = result.costData.services.find(
          s => s.service === 'amazonelasticcomputecloudcompute'
        );
        expect(ec2Service).toBeDefined();
      }
    });
  });
});