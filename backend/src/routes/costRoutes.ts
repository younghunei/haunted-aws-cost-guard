import { Router, Request, Response } from 'express';
import multer from 'multer';
import { DemoDataService } from '../services/demoDataService';
import { AWSService } from '../services/awsService';
import { CSVUploadService } from '../services/csvUploadService';
import { budgetService } from '../services/budgetService';
import { ModeSelectionRequest, ApiResponse, AWSCredentials } from '../types';
import Joi from 'joi';

/**
 * @swagger
 * components:
 *   schemas:
 *     CostData:
 *       $ref: '#/components/schemas/CostData'
 *     ServiceCost:
 *       $ref: '#/components/schemas/ServiceCost'
 *     AWSCredentials:
 *       $ref: '#/components/schemas/AWSCredentials'
 *     Error:
 *       $ref: '#/components/schemas/Error'
 */

const router = Router();
const demoDataService = new DemoDataService();
const awsService = new AWSService();
const csvUploadService = new CSVUploadService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      const error = new Error('Only CSV files are allowed') as any;
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  }
});

// Middleware to handle multer errors
const handleMulterError = (error: any, req: any, res: any, next: any) => {
  if (error) {
    if (error.code === 'INVALID_FILE_TYPE' || error.message === 'Only CSV files are allowed') {
      return res.status(400).json({
        success: false,
        error: 'Only CSV files are allowed'
      });
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 10MB.'
      });
    }
    return res.status(400).json({
      success: false,
      error: 'File upload error'
    });
  }
  next();
};

// Validation schemas
const modeSelectionSchema = Joi.object({
  mode: Joi.string().valid('demo', 'aws').required(),
  credentials: Joi.object({
    accessKeyId: Joi.string().required(),
    secretAccessKey: Joi.string().required(),
    region: Joi.string().optional()
  }).when('mode', {
    is: 'aws',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const credentialsSchema = Joi.object({
  accessKeyId: Joi.string().required(),
  secretAccessKey: Joi.string().required(),
  region: Joi.string().optional().default('us-east-1')
});

/**
 * @swagger
 * /cost/demo:
 *   get:
 *     summary: 👻 Get spooky demo cost data
 *     description: Retrieve sample AWS cost data for exploring the haunted mansion without real AWS credentials
 *     tags: [🎭 Demo Mode]
 *     responses:
 *       200:
 *         description: Demo data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CostData'
 *                 message:
 *                   type: string
 *                   example: "Demo data retrieved successfully"
 *       500:
 *         description: Failed to retrieve demo data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/demo', (req: Request, res: Response) => {
  try {
    // Initialize demo budgets if they don't exist
    const existingBudgets = budgetService.getBudgets('demo');
    if (existingBudgets.length === 0) {
      budgetService.initializeDemoBudgets();
    }
    
    const demoData = demoDataService.getDemoData();
    const response: ApiResponse<typeof demoData> = {
      success: true,
      data: demoData,
      message: 'Demo data retrieved successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to retrieve demo data'
    };
    res.status(500).json(response);
  }
});

// GET /api/cost/demo/scenarios - Get available demo scenarios
router.get('/demo/scenarios', (req: Request, res: Response) => {
  try {
    const scenarios = demoDataService.getDemoScenarios();
    const response: ApiResponse<typeof scenarios> = {
      success: true,
      data: scenarios,
      message: 'Demo scenarios retrieved successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to retrieve demo scenarios'
    };
    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /cost/validate-credentials:
 *   post:
 *     summary: 🔐 Validate AWS credentials
 *     description: Check if provided AWS credentials are valid and have necessary permissions
 *     tags: [🔐 Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AWSCredentials'
 *     responses:
 *       200:
 *         description: Credentials validated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "AWS credentials validated successfully"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post('/validate-credentials', async (req: Request, res: Response) => {
  try {
    const { error, value } = credentialsSchema.validate(req.body);
    
    if (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Validation error: ${error.details[0].message}`
      };
      return res.status(400).json(response);
    }

    const credentials: AWSCredentials = value;
    const isValid = await awsService.validateCredentials(credentials);
    
    if (isValid) {
      const response: ApiResponse<{ valid: boolean }> = {
        success: true,
        data: { valid: true },
        message: 'AWS credentials validated successfully'
      };
      res.json(response);
    } else {
      const response: ApiResponse<{ valid: boolean }> = {
        success: false,
        data: { valid: false },
        error: 'Invalid AWS credentials or insufficient permissions'
      };
      res.status(401).json(response);
    }
  } catch (error) {
    console.error('Credential validation error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Internal server error during credential validation'
    };
    res.status(500).json(response);
  }
});

// GET /api/cost/aws - Get real AWS cost data (requires validated credentials)
router.get('/aws', async (req: Request, res: Response) => {
  try {
    const costData = await awsService.getCostData();
    const response: ApiResponse<typeof costData> = {
      success: true,
      data: costData,
      message: 'AWS cost data retrieved successfully'
    };
    res.json(response);
  } catch (error) {
    console.error('AWS cost data retrieval error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve AWS cost data'
    };
    res.status(500).json(response);
  }
});

// POST /api/cost/mode - Set application mode (demo or AWS)
router.post('/mode', async (req: Request, res: Response) => {
  try {
    const { error, value } = modeSelectionSchema.validate(req.body);
    
    if (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: `Validation error: ${error.details[0].message}`
      };
      return res.status(400).json(response);
    }

    const modeRequest: ModeSelectionRequest = value;
    
    if (modeRequest.mode === 'aws' && modeRequest.credentials) {
      // Validate AWS credentials before setting mode
      const isValid = await awsService.validateCredentials(modeRequest.credentials);
      
      if (!isValid) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Invalid AWS credentials. Cannot switch to AWS mode.'
        };
        return res.status(401).json(response);
      }
    }

    const response: ApiResponse<{ mode: string }> = {
      success: true,
      data: { mode: modeRequest.mode },
      message: `Successfully switched to ${modeRequest.mode} mode`
    };
    res.json(response);
  } catch (error) {
    console.error('Mode selection error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to set application mode'
    };
    res.status(500).json(response);
  }
});

// GET /api/cost/aws/services - Get available AWS services
router.get('/aws/services', async (req: Request, res: Response) => {
  try {
    const services = await awsService.getAvailableServices();
    const response: ApiResponse<string[]> = {
      success: true,
      data: services,
      message: 'Available AWS services retrieved successfully'
    };
    res.json(response);
  } catch (error) {
    console.error('Failed to get available services:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve available services'
    };
    res.status(500).json(response);
  }
});

// POST /api/cost/aws/refresh - Refresh AWS cost data (clear cache)
router.post('/aws/refresh', async (req: Request, res: Response) => {
  try {
    await awsService.refreshCostData();
    const response: ApiResponse<{ refreshed: boolean }> = {
      success: true,
      data: { refreshed: true },
      message: 'Cost data cache cleared, next request will fetch fresh data'
    };
    res.json(response);
  } catch (error) {
    console.error('Failed to refresh cost data:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to refresh cost data'
    };
    res.status(500).json(response);
  }
});

// GET /api/cost/aws/cache-stats - Get cache statistics
router.get('/aws/cache-stats', (req: Request, res: Response) => {
  try {
    const stats = awsService.getCacheStats();
    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
      message: 'Cache statistics retrieved successfully'
    };
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to retrieve cache statistics'
    };
    res.status(500).json(response);
  }
});

/**
 * @swagger
 * /cost/upload-csv:
 *   post:
 *     summary: 📊 Upload AWS Cost Explorer CSV
 *     description: Upload and process a CSV export from AWS Cost Explorer to populate the haunted mansion
 *     tags: [👻 Cost Data]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               csvFile:
 *                 type: string
 *                 format: binary
 *                 description: CSV file exported from AWS Cost Explorer
 *     responses:
 *       200:
 *         description: CSV processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CostData'
 *                 message:
 *                   type: string
 *                   example: "CSV processed successfully. 150 rows processed."
 *       400:
 *         description: Invalid CSV file or format
 *       500:
 *         description: Processing error
 */
router.post('/upload-csv', upload.single('csvFile'), handleMulterError, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'No CSV file provided'
      };
      return res.status(400).json(response);
    }

    // Validate CSV format first
    const validation = await csvUploadService.validateCSVFormat(req.file.buffer);
    if (!validation.valid) {
      const response: ApiResponse<null> = {
        success: false,
        error: validation.error || 'Invalid CSV format'
      };
      return res.status(400).json(response);
    }

    // Process the CSV file
    const result = await csvUploadService.processCostExplorerCSV(req.file.buffer);
    
    if (result.success && result.costData) {
      const response: ApiResponse<typeof result.costData> = {
        success: true,
        data: result.costData,
        message: `CSV processed successfully. ${result.rowsProcessed} rows processed.`
      };
      res.json(response);
    } else {
      const response: ApiResponse<null> = {
        success: false,
        error: result.error || 'Failed to process CSV file'
      };
      res.status(400).json(response);
    }
  } catch (error) {
    console.error('CSV upload error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process CSV upload'
    };
    res.status(500).json(response);
  }
});

// POST /api/cost/validate-csv - Validate CSV format without processing
router.post('/validate-csv', upload.single('csvFile'), handleMulterError, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'No CSV file provided'
      };
      return res.status(400).json(response);
    }

    const validation = await csvUploadService.validateCSVFormat(req.file.buffer);
    
    const response: ApiResponse<{ valid: boolean; format?: string }> = {
      success: validation.valid,
      data: {
        valid: validation.valid,
        format: validation.format
      },
      message: validation.valid ? 'CSV format is valid' : undefined,
      error: validation.error
    };
    
    res.status(validation.valid ? 200 : 400).json(response);
  } catch (error) {
    console.error('CSV validation error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to validate CSV file'
    };
    res.status(500).json(response);
  }
});

// GET /api/cost/aws/test-connection - Test AWS connection
router.get('/aws/test-connection', async (req: Request, res: Response) => {
  try {
    const isConnected = await awsService.testConnection();
    const response: ApiResponse<{ connected: boolean }> = {
      success: isConnected,
      data: { connected: isConnected },
      message: isConnected ? 'AWS connection successful' : 'AWS connection failed'
    };
    res.status(isConnected ? 200 : 503).json(response);
  } catch (error) {
    console.error('AWS connection test error:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to test AWS connection'
    };
    res.status(500).json(response);
  }
});

// GET /api/cost/health - Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  const response: ApiResponse<{ status: string; timestamp: string }> = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString()
    },
    message: 'Cost API is running'
  };
  res.json(response);
});

export default router;