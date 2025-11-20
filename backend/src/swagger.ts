import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

/**
 * 🎃 Haunted AWS Cost Guard API Documentation
 * Swagger/OpenAPI specification for our supernatural cost monitoring API
 */

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '👻 Haunted AWS Cost Guard API',
      version: '1.0.0',
      description: `
        🏚️ **Supernatural AWS Cost Monitoring API**
        
        Transform your AWS billing data into a haunted mansion experience! 
        This API provides endpoints for cost data retrieval, budget management, 
        and supernatural entity visualization.
        
        ## 🦇 Features
        - **Demo Mode**: Explore with spooky sample data
        - **AWS Integration**: Real-time cost monitoring
        - **Budget Management**: Set thresholds for supernatural alerts
        - **Export Capabilities**: Share your haunted insights
        
        ## 👻 Authentication
        For AWS mode, provide valid AWS credentials or upload Cost Explorer CSV files.
        Demo mode requires no authentication - just pure supernatural fun!
      `,
      contact: {
        name: 'Haunted Support Team',
        email: 'spirits@hauntedcostguard.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development server (Local Haunted Mansion)'
      },
      {
        url: 'https://api.hauntedcostguard.com/api',
        description: 'Production server (The Real Haunted Mansion)'
      }
    ],
    components: {
      schemas: {
        CostData: {
          type: 'object',
          properties: {
            services: {
              type: 'array',
              items: { $ref: '#/components/schemas/ServiceCost' }
            },
            totalCost: {
              type: 'number',
              description: 'Total cost across all services'
            },
            currency: {
              type: 'string',
              example: 'USD'
            },
            lastUpdated: {
              type: 'string',
              format: 'date-time'
            },
            budgetAlerts: {
              type: 'array',
              items: { $ref: '#/components/schemas/BudgetAlert' }
            }
          }
        },
        ServiceCost: {
          type: 'object',
          properties: {
            service: {
              type: 'string',
              example: 'EC2',
              description: 'AWS service name'
            },
            displayName: {
              type: 'string',
              example: 'EC2 Crypt',
              description: 'Haunted display name for the service'
            },
            totalCost: {
              type: 'number',
              example: 150.75
            },
            currency: {
              type: 'string',
              example: 'USD'
            },
            budgetUtilization: {
              type: 'number',
              minimum: 0,
              description: 'Budget utilization ratio (0-1+, can exceed 1 for overruns)'
            },
            regions: {
              type: 'array',
              items: { $ref: '#/components/schemas/RegionCost' }
            },
            tags: {
              type: 'array',
              items: { $ref: '#/components/schemas/TagCost' }
            },
            dailyCosts: {
              type: 'array',
              items: { $ref: '#/components/schemas/DailyCost' }
            },
            trend: {
              type: 'string',
              enum: ['increasing', 'decreasing', 'stable']
            }
          }
        },
        RegionCost: {
          type: 'object',
          properties: {
            region: {
              type: 'string',
              example: 'us-east-1'
            },
            cost: {
              type: 'number',
              example: 75.25
            },
            percentage: {
              type: 'number',
              example: 50.0
            }
          }
        },
        TagCost: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              example: 'Environment'
            },
            value: {
              type: 'string',
              example: 'Production'
            },
            cost: {
              type: 'number',
              example: 100.50
            },
            percentage: {
              type: 'number',
              example: 66.7
            }
          }
        },
        DailyCost: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              format: 'date'
            },
            cost: {
              type: 'number',
              example: 25.75
            }
          }
        },
        Budget: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'budget-123'
            },
            accountId: {
              type: 'string',
              example: 'aws-account-456'
            },
            service: {
              type: 'string',
              nullable: true,
              example: 'EC2',
              description: 'Service name, null for account-wide budget'
            },
            amount: {
              type: 'number',
              example: 1000.00
            },
            currency: {
              type: 'string',
              example: 'USD'
            },
            period: {
              type: 'string',
              enum: ['monthly', 'quarterly', 'yearly']
            },
            alertThresholds: {
              type: 'array',
              items: {
                type: 'number'
              },
              example: [50, 80, 100],
              description: 'Alert thresholds as percentages'
            }
          }
        },
        BudgetAlert: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            },
            budgetId: {
              type: 'string'
            },
            service: {
              type: 'string'
            },
            threshold: {
              type: 'number',
              description: 'Threshold percentage that was exceeded'
            },
            currentUtilization: {
              type: 'number',
              description: 'Current budget utilization percentage'
            },
            severity: {
              type: 'string',
              enum: ['warning', 'critical', 'emergency']
            },
            message: {
              type: 'string',
              example: 'EC2 Crypt spirits are getting restless! 80% budget consumed.'
            }
          }
        },
        AWSCredentials: {
          type: 'object',
          properties: {
            accessKeyId: {
              type: 'string',
              description: 'AWS Access Key ID'
            },
            secretAccessKey: {
              type: 'string',
              description: 'AWS Secret Access Key'
            },
            region: {
              type: 'string',
              example: 'us-east-1'
            },
            sessionToken: {
              type: 'string',
              nullable: true,
              description: 'Optional session token for temporary credentials'
            }
          },
          required: ['accessKeyId', 'secretAccessKey', 'region']
        },
        ExportRequest: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              enum: ['pdf', 'json', 'csv']
            },
            includeVisuals: {
              type: 'boolean',
              description: 'Include mansion visualization in export'
            },
            dateRange: {
              type: 'object',
              properties: {
                start: {
                  type: 'string',
                  format: 'date'
                },
                end: {
                  type: 'string',
                  format: 'date'
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            }
          }
        }
      },
      securitySchemes: {
        AWSCredentials: {
          type: 'apiKey',
          in: 'header',
          name: 'X-AWS-Credentials',
          description: 'Base64 encoded AWS credentials JSON'
        }
      }
    },
    tags: [
      {
        name: '👻 Cost Data',
        description: 'Retrieve and manage supernatural cost information'
      },
      {
        name: '💰 Budget Management',
        description: 'Set and monitor budget thresholds for supernatural alerts'
      },
      {
        name: '🔐 Authentication',
        description: 'AWS credential validation and management'
      },
      {
        name: '📊 Export & Sharing',
        description: 'Export mansion states and cost data'
      },
      {
        name: '🎭 Demo Mode',
        description: 'Sample data for exploring the haunted experience'
      }
    ]
  },
  apis: ['./src/routes/*.ts'], // Path to the API files
};

const specs = swaggerJSDoc(options);

export const setupSwagger = (app: Express): void => {
  // Custom CSS for spooky theme
  const customCss = `
    .swagger-ui .topbar { 
      background-color: #1a1a2e; 
      border-bottom: 2px solid #ff6b35;
    }
    .swagger-ui .topbar .download-url-wrapper { 
      display: none; 
    }
    .swagger-ui .info .title { 
      color: #ff6b35; 
    }
    .swagger-ui .scheme-container { 
      background: #16213e; 
      border: 1px solid #ff6b35;
    }
    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: #6b46c1;
    }
    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: #dc2626;
    }
    .swagger-ui .opblock.opblock-put .opblock-summary-method {
      background: #ea580c;
    }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method {
      background: #7c2d12;
    }
  `;

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss,
    customSiteTitle: '👻 Haunted AWS Cost Guard API',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true
    }
  }));
};

export default specs;