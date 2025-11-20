import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { exportService } from '../services/exportService';

const router = Router();

// Validation schemas
const shareRequestSchema = Joi.object({
  snapshot: Joi.object().required(),
  options: Joi.object({
    expirationHours: Joi.number().min(1).max(8760).default(24), // Max 1 year
    maxViews: Joi.number().min(1).max(10000).optional(),
    includeData: Joi.boolean().default(true),
    password: Joi.string().min(4).max(50).optional()
  }).required()
});

const shareIdSchema = Joi.object({
  shareId: Joi.string().uuid().required()
});

const shareAccessSchema = Joi.object({
  password: Joi.string().optional()
});

/**
 * POST /api/export/share
 * Create a shareable link for mansion data
 */
router.post('/share', async (req: Request, res: Response) => {
  try {
    const { error, value } = shareRequestSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.details
      });
    }

    const { snapshot, options } = value;

    // Create shareable link
    const shareData = exportService.createShareableLink(snapshot, options);

    res.json({
      success: true,
      data: {
        id: shareData.id,
        expiresAt: shareData.expiresAt,
        createdAt: shareData.createdAt,
        maxViews: shareData.options.maxViews
      }
    });
  } catch (error) {
    console.error('Error creating shareable link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create shareable link'
    });
  }
});

/**
 * GET /api/export/share/:shareId
 * Get shared mansion data
 */
router.get('/share/:shareId', async (req: Request, res: Response) => {
  try {
    const { error: paramError, value: params } = shareIdSchema.validate({
      shareId: req.params.shareId
    });
    
    if (paramError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid share ID format'
      });
    }

    const { error: queryError, value: query } = shareAccessSchema.validate(req.query);
    
    if (queryError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters'
      });
    }

    const { shareId } = params;
    const { password } = query;

    try {
      const shareData = exportService.getSharedData(shareId, password);
      
      if (!shareData) {
        return res.status(404).json({
          success: false,
          error: 'Shared link not found or expired'
        });
      }

      res.json({
        success: true,
        data: {
          snapshot: shareData.snapshot,
          viewCount: shareData.viewCount,
          expiresAt: shareData.expiresAt,
          createdAt: shareData.createdAt
        }
      });
    } catch (shareError) {
      if (shareError instanceof Error) {
        if (shareError.message === 'Invalid password') {
          return res.status(401).json({
            success: false,
            error: 'Password required or incorrect'
          });
        } else if (shareError.message === 'Maximum view limit reached') {
          return res.status(429).json({
            success: false,
            error: 'Maximum view limit reached'
          });
        }
      }
      throw shareError;
    }
  } catch (error) {
    console.error('Error getting shared data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve shared data'
    });
  }
});

/**
 * GET /api/export/share/:shareId/stats
 * Get share statistics
 */
router.get('/share/:shareId/stats', async (req: Request, res: Response) => {
  try {
    const { error, value } = shareIdSchema.validate({
      shareId: req.params.shareId
    });
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid share ID format'
      });
    }

    const { shareId } = value;
    const stats = exportService.getShareStatistics(shareId);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'Share not found'
      });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting share statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve share statistics'
    });
  }
});

/**
 * POST /api/export/csv
 * Generate CSV export from cost data
 */
router.post('/csv', async (req: Request, res: Response) => {
  try {
    const servicesSchema = Joi.object({
      services: Joi.array().items(Joi.object()).required(),
      detailed: Joi.boolean().default(false)
    });

    const { error, value } = servicesSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.details
      });
    }

    const { services, detailed } = value;

    const csvData = detailed 
      ? exportService.generateDetailedCSV(services)
      : exportService.generateCSV(services);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="cost-data.csv"');
    res.send(csvData);
  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate CSV'
    });
  }
});

/**
 * POST /api/export/json
 * Generate JSON export from mansion snapshot
 */
router.post('/json', async (req: Request, res: Response) => {
  try {
    const snapshotSchema = Joi.object({
      snapshot: Joi.object().required()
    });

    const { error, value } = snapshotSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.details
      });
    }

    const { snapshot } = value;
    const jsonData = exportService.generateJSONExport(snapshot);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="mansion-data.json"');
    res.send(jsonData);
  } catch (error) {
    console.error('Error generating JSON:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate JSON'
    });
  }
});

/**
 * GET /api/export/stats
 * Get export service statistics (admin endpoint)
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const cacheStats = exportService.getCacheStats();
    const activeShares = exportService.getAllActiveShares();
    
    res.json({
      success: true,
      data: {
        cache: cacheStats,
        activeShares: activeShares.length,
        shares: activeShares.map(share => ({
          id: share.id,
          createdAt: share.createdAt,
          expiresAt: share.expiresAt,
          viewCount: share.viewCount,
          maxViews: share.options.maxViews,
          hasPassword: !!share.options.password
        }))
      }
    });
  } catch (error) {
    console.error('Error getting export stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve export statistics'
    });
  }
});

/**
 * DELETE /api/export/cleanup
 * Cleanup expired shares (admin endpoint)
 */
router.delete('/cleanup', async (req: Request, res: Response) => {
  try {
    const deletedCount = exportService.cleanupExpiredShares();
    
    res.json({
      success: true,
      data: {
        deletedCount,
        message: `Cleaned up ${deletedCount} expired shares`
      }
    });
  } catch (error) {
    console.error('Error cleaning up expired shares:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup expired shares'
    });
  }
});

export default router;