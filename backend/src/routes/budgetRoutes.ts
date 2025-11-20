import { Router, Request, Response } from 'express';
import { budgetService } from '../services/budgetService';
import { Budget, ApiResponse } from '../types';

/**
 * @swagger
 * components:
 *   schemas:
 *     Budget:
 *       $ref: '#/components/schemas/Budget'
 *     BudgetAlert:
 *       $ref: '#/components/schemas/BudgetAlert'
 */

const router = Router();

/**
 * @swagger
 * /budget/{accountId}:
 *   get:
 *     summary: 💰 Get all budgets for account
 *     description: Retrieve all budget configurations for a specific AWS account or demo mode
 *     tags: [💰 Budget Management]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: AWS account ID or 'demo' for demo mode
 *         example: "demo"
 *     responses:
 *       200:
 *         description: Budgets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Budget'
 *       500:
 *         description: Server error
 */
router.get('/:accountId', (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const budgets = budgetService.getBudgets(accountId);
    
    const response: ApiResponse<Budget[]> = {
      success: true,
      data: budgets
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
});

// Get budget for a specific service
router.get('/:accountId/:service', (req: Request, res: Response) => {
  try {
    const { accountId, service } = req.params;
    const budget = budgetService.getBudgetByService(accountId, service);
    
    if (!budget) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Budget not found'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<Budget> = {
      success: true,
      data: budget
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
});

// Create or update a budget
router.post('/', (req: Request, res: Response) => {
  try {
    const budgetData = req.body;
    
    // Validate required fields
    if (!budgetData.accountId || !budgetData.amount || !budgetData.currency || !budgetData.period) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Missing required fields: accountId, amount, currency, period'
      };
      return res.status(400).json(response);
    }

    // Validate alert thresholds
    if (!budgetData.alertThresholds || !Array.isArray(budgetData.alertThresholds)) {
      budgetData.alertThresholds = [50, 80, 100];
    }

    const budget = budgetService.saveBudget(budgetData);
    
    const response: ApiResponse<Budget> = {
      success: true,
      data: budget,
      message: 'Budget saved successfully'
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
});

// Delete a budget
router.delete('/:budgetId', (req: Request, res: Response) => {
  try {
    const { budgetId } = req.params;
    const deleted = budgetService.deleteBudget(budgetId);
    
    if (!deleted) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Budget not found'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Budget deleted successfully'
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
});

// Get budget utilization for an account
router.get('/:accountId/utilization', (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    
    // This would typically get services from the cost service
    // For now, we'll return a placeholder response
    const response: ApiResponse<any> = {
      success: true,
      data: [],
      message: 'Budget utilization calculation requires cost data'
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
});

// Get budget notifications
router.get('/:accountId/notifications', (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;
    const notifications = budgetService.getNotifications(accountId);
    
    const response: ApiResponse<any> = {
      success: true,
      data: notifications
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
});

// Acknowledge a notification
router.patch('/notifications/:notificationId/acknowledge', (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const acknowledged = budgetService.acknowledgeNotification(notificationId);
    
    if (!acknowledged) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Notification not found'
      };
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Notification acknowledged'
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
});

// Initialize demo budgets
router.post('/demo/initialize', (req: Request, res: Response) => {
  try {
    budgetService.initializeDemoBudgets();
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Demo budgets initialized'
    };
    
    res.json(response);
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    res.status(500).json(response);
  }
});

export default router;