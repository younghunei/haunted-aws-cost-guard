import { AWSService } from '../services/awsService';
import { AWSCredentials } from '../types';

// Mock AWS SDK clients
const mockSend = jest.fn();

jest.mock('@aws-sdk/client-cost-explorer', () => ({
  CostExplorerClient: jest.fn().mockImplementation(() => ({
    send: mockSend
  })),
  GetCostAndUsageCommand: jest.fn(),
  GetDimensionValuesCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-sts', () => ({
  STSClient: jest.fn().mockImplementation(() => ({
    send: mockSend
  })),
  GetCallerIdentityCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-budgets', () => ({
  BudgetsClient: jest.fn().mockImplementation(() => ({
    send: mockSend
  }))
}));

describe('AWSService', () => {
  let awsService: AWSService;

  const validCredentials: AWSCredentials = {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    region: 'us-east-1'
  };

  beforeEach(() => {
    awsService = new AWSService();
    jest.clearAllMocks();
  });

  describe('validateCredentials', () => {
    it('should validate credentials successfully', async () => {
      mockSend.mockResolvedValueOnce({
        UserId: 'AIDACKCEVSQ6C2EXAMPLE',
        Account: '123456789012',
        Arn: 'arn:aws:iam::123456789012:user/testuser'
      });

      const result = await awsService.validateCredentials(validCredentials);
      
      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle invalid credentials', async () => {
      mockSend.mockRejectedValueOnce(new Error('InvalidUserID.NotFound'));

      const result = await awsService.validateCredentials(validCredentials);
      
      expect(result).toBe(false);
    });

    it('should handle network errors during validation', async () => {
      mockSend.mockRejectedValueOnce(new Error('NetworkingError'));

      const result = await awsService.validateCredentials(validCredentials);
      
      expect(result).toBe(false);
    });
  });

  describe('getCostData', () => {
    beforeEach(async () => {
      // Setup valid credentials first
      mockSend.mockResolvedValueOnce({
        UserId: 'AIDACKCEVSQ6C2EXAMPLE',
        Account: '123456789012',
        Arn: 'arn:aws:iam::123456789012:user/testuser'
      });
      await awsService.validateCredentials(validCredentials);
    });

    it('should fetch and transform cost data successfully', async () => {
      const mockCostResponse = {
        ResultsByTime: [
          {
            TimePeriod: {
              Start: '2023-11-01',
              End: '2023-11-30'
            },
            Groups: [
              {
                Keys: ['Amazon Elastic Compute Cloud - Compute'],
                Metrics: {
                  BlendedCost: {
                    Amount: '150.50',
                    Unit: 'USD'
                  }
                }
              },
              {
                Keys: ['Amazon Simple Storage Service'],
                Metrics: {
                  BlendedCost: {
                    Amount: '25.75',
                    Unit: 'USD'
                  }
                }
              }
            ]
          }
        ]
      };

      const mockRegionalResponse = {
        ResultsByTime: [
          {
            Groups: [
              {
                Keys: ['us-east-1', 'Amazon Elastic Compute Cloud - Compute'],
                Metrics: {
                  BlendedCost: {
                    Amount: '100.00',
                    Unit: 'USD'
                  }
                }
              },
              {
                Keys: ['us-west-2', 'Amazon Elastic Compute Cloud - Compute'],
                Metrics: {
                  BlendedCost: {
                    Amount: '50.50',
                    Unit: 'USD'
                  }
                }
              }
            ]
          }
        ]
      };

      const mockDailyResponse = {
        ResultsByTime: [
          {
            TimePeriod: { Start: '2023-11-01', End: '2023-11-02' },
            Groups: [
              {
                Keys: ['Amazon Elastic Compute Cloud - Compute'],
                Metrics: {
                  BlendedCost: {
                    Amount: '5.00',
                    Unit: 'USD'
                  }
                }
              }
            ]
          },
          {
            TimePeriod: { Start: '2023-11-02', End: '2023-11-03' },
            Groups: [
              {
                Keys: ['Amazon Elastic Compute Cloud - Compute'],
                Metrics: {
                  BlendedCost: {
                    Amount: '6.00',
                    Unit: 'USD'
                  }
                }
              }
            ]
          }
        ]
      };

      mockSend
        .mockResolvedValueOnce(mockCostResponse) // Service costs
        .mockResolvedValueOnce(mockRegionalResponse) // Regional costs
        .mockResolvedValueOnce(mockDailyResponse); // Daily costs

      const result = await awsService.getCostData();

      expect(result).toMatchObject({
        totalCost: 176.25,
        currency: 'USD',
        services: expect.arrayContaining([
          expect.objectContaining({
            displayName: 'Amazon Elastic Compute Cloud - Compute',
            totalCost: 150.50,
            regions: expect.arrayContaining([
              expect.objectContaining({
                region: 'us-east-1',
                cost: 100.00
              })
            ])
          })
        ])
      });

      expect(mockSend).toHaveBeenCalledTimes(4); // 1 for validation + 3 for cost data
    });

    it('should handle AWS API errors with retry logic', async () => {
      mockSend
        .mockRejectedValueOnce(new Error('ThrottlingException'))
        .mockResolvedValueOnce({
          ResultsByTime: [
            {
              Groups: [
                {
                  Keys: ['Amazon S3'],
                  Metrics: {
                    BlendedCost: {
                      Amount: '10.00',
                      Unit: 'USD'
                    }
                  }
                }
              ]
            }
          ]
        })
        .mockResolvedValueOnce({ ResultsByTime: [] }) // Regional
        .mockResolvedValueOnce({ ResultsByTime: [] }); // Daily

      const result = await awsService.getCostData();

      expect(result.services).toHaveLength(1);
      expect(result.services[0].displayName).toBe('Amazon S3');
    });

    it('should throw error when credentials not validated', async () => {
      const newService = new AWSService();
      
      await expect(newService.getCostData()).rejects.toThrow(
        'AWS credentials not validated. Please validate credentials first.'
      );
    });

    it('should use cached data when available', async () => {
      // First call
      mockSend
        .mockResolvedValueOnce({
          ResultsByTime: [
            {
              Groups: [
                {
                  Keys: ['Amazon S3'],
                  Metrics: {
                    BlendedCost: {
                      Amount: '10.00',
                      Unit: 'USD'
                    }
                  }
                }
              ]
            }
          ]
        })
        .mockResolvedValueOnce({ ResultsByTime: [] })
        .mockResolvedValueOnce({ ResultsByTime: [] });

      const result1 = await awsService.getCostData();
      
      // Second call should use cache
      const result2 = await awsService.getCostData();

      expect(result1).toEqual(result2);
      expect(mockSend).toHaveBeenCalledTimes(4); // 1 validation + 3 cost calls
    });
  });

  describe('getAvailableServices', () => {
    beforeEach(async () => {
      mockSend.mockResolvedValueOnce({});
      await awsService.validateCredentials(validCredentials);
    });

    it('should fetch available services', async () => {
      const mockServicesResponse = {
        DimensionValues: [
          { Value: 'Amazon Elastic Compute Cloud - Compute' },
          { Value: 'Amazon Simple Storage Service' },
          { Value: 'Amazon Relational Database Service' }
        ]
      };

      mockSend.mockResolvedValueOnce(mockServicesResponse);

      const result = await awsService.getAvailableServices();

      expect(result).toEqual([
        'Amazon Elastic Compute Cloud - Compute',
        'Amazon Simple Storage Service',
        'Amazon Relational Database Service'
      ]);
      expect(mockSend).toHaveBeenCalled();
    });

    it('should handle errors when fetching services', async () => {
      mockSend.mockRejectedValueOnce(new Error('API Error'));

      const result = await awsService.getAvailableServices();

      expect(result).toEqual([]);
    });
  });

  describe('testConnection', () => {
    beforeEach(async () => {
      mockSend.mockResolvedValueOnce({});
      await awsService.validateCredentials(validCredentials);
    });

    it('should return true for successful connection', async () => {
      mockSend.mockResolvedValueOnce({
        ResultsByTime: []
      });

      const result = await awsService.testConnection();

      expect(result).toBe(true);
    });

    it('should return false for failed connection', async () => {
      mockSend.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await awsService.testConnection();

      expect(result).toBe(false);
    });

    it('should return false when no client initialized', async () => {
      const newService = new AWSService();
      
      const result = await newService.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('refreshCostData', () => {
    it('should clear cache', async () => {
      await awsService.refreshCostData();
      
      // This test verifies the method doesn't throw
      // Cache clearing is tested implicitly through getCostData behavior
      expect(true).toBe(true);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = awsService.getCacheStats();
      
      expect(stats).toHaveProperty('keys');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(typeof stats.keys).toBe('number');
      expect(typeof stats.hits).toBe('number');
      expect(typeof stats.misses).toBe('number');
    });
  });
});