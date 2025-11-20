import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import costRoutes from './routes/costRoutes';
import budgetRoutes from './routes/budgetRoutes';
import exportRoutes from './routes/exportRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3004',
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ].filter(Boolean),
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/cost', costRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/export', exportRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Haunted AWS Cost Guard API',
      version: process.env.npm_package_version || '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        cost: '/api/cost',
        budget: '/api/budget',
        export: '/api/export'
      }
    },
    message: '🏚️ Welcome to the Haunted AWS Cost Guard API'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    },
    message: 'Haunted AWS Cost Guard API is running'
  });
});

// Favicon handler (브라우저가 자동으로 요청하는 favicon.ico 처리) (Handle favicon.ico requests automatically made by browsers)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;