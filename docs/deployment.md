# 🚀 Haunted AWS Cost Guard - Deployment Guide

This guide covers everything you need to deploy and configure the Haunted AWS Cost Guard in various environments, from local development to production haunted mansions.

## 🎃 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Environment Configuration](#environment-configuration)
4. [Production Deployment](#production-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Cloud Deployment Options](#cloud-deployment-options)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Security Considerations](#security-considerations)
9. [Troubleshooting](#troubleshooting)

## 📋 Prerequisites

### System Requirements

**Minimum Requirements:**
- Node.js 18.x or higher
- npm 9.x or higher
- 2GB RAM
- 1GB disk space

**Recommended Requirements:**
- Node.js 20.x LTS
- npm 10.x
- 4GB RAM
- 5GB disk space (for logs and cache)

### Development Tools

```bash
# Required tools
node --version  # Should be 18.x+
npm --version   # Should be 9.x+

# Optional but recommended
git --version
docker --version
```

### AWS Prerequisites (for AWS mode)

- AWS Account with billing access
- IAM user with Cost Explorer permissions
- AWS CLI configured (optional but helpful)

## 🏠 Local Development Setup

### 1. Clone and Install

```bash
# Clone the haunted repository
git clone https://github.com/your-org/haunted-aws-cost-guard.git
cd haunted-aws-cost-guard

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Configuration

Create environment files for both frontend and backend:

**Frontend (.env):**
```bash
# Frontend environment variables
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME="Haunted AWS Cost Guard"
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEMO_MODE=true
VITE_ENABLE_AWS_MODE=true
```

**Backend (backend/.env):**
```bash
# Server configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# AWS Configuration (optional for demo mode)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# Cache configuration
CACHE_TTL=300000  # 5 minutes in milliseconds
CACHE_MAX_SIZE=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/haunted-api.log

# Security
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. Start Development Servers

```bash
# Terminal 1: Start backend API
cd backend
npm run dev

# Terminal 2: Start frontend (in project root)
npm run dev
```

### 4. Verify Installation

Open your browser and navigate to:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api-docs

## ⚙️ Environment Configuration

### Environment Variables Reference

#### Frontend Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3001/api` | Yes |
| `VITE_APP_NAME` | Application display name | `Haunted AWS Cost Guard` | No |
| `VITE_APP_VERSION` | Version displayed in UI | `1.0.0` | No |
| `VITE_ENABLE_DEMO_MODE` | Enable demo mode | `true` | No |
| `VITE_ENABLE_AWS_MODE` | Enable AWS integration | `true` | No |
| `VITE_SENTRY_DSN` | Error tracking DSN | - | No |

#### Backend Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3001` | No |
| `NODE_ENV` | Environment mode | `development` | No |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` | Yes |
| `AWS_REGION` | Default AWS region | `us-east-1` | No |
| `AWS_ACCESS_KEY_ID` | AWS credentials | - | No* |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials | - | No* |
| `CACHE_TTL` | Cache time-to-live (ms) | `300000` | No |
| `CACHE_MAX_SIZE` | Max cache entries | `100` | No |
| `LOG_LEVEL` | Logging level | `info` | No |
| `LOG_FILE` | Log file path | `logs/haunted-api.log` | No |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:5173` | No |

*Required only for AWS mode with server-side credentials

### Configuration Files

#### TypeScript Configuration

The project uses TypeScript with strict configuration:

**Frontend (tsconfig.json):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Backend (backend/tsconfig.json):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

## 🏭 Production Deployment

### 1. Build for Production

```bash
# Build frontend
npm run build

# Build backend
cd backend
npm run build
cd ..
```

### 2. Production Environment Setup

**Production .env files:**

**Frontend (.env.production):**
```bash
VITE_API_URL=https://api.yourdomain.com/api
VITE_APP_NAME="Haunted AWS Cost Guard"
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEMO_MODE=true
VITE_ENABLE_AWS_MODE=true
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

**Backend (backend/.env.production):**
```bash
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com

# AWS Configuration
AWS_REGION=us-east-1

# Cache configuration (increased for production)
CACHE_TTL=600000  # 10 minutes
CACHE_MAX_SIZE=500

# Logging
LOG_LEVEL=warn
LOG_FILE=/var/log/haunted-api/app.log

# Security
CORS_ORIGINS=https://yourdomain.com
```

### 3. Process Management

Use PM2 for production process management:

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'haunted-api',
    script: './backend/dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    log_file: '/var/log/haunted-api/combined.log',
    out_file: '/var/log/haunted-api/out.log',
    error_file: '/var/log/haunted-api/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G'
  }]
};
```

```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

### 4. Reverse Proxy Setup (Nginx)

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Frontend static files
    location / {
        root /var/www/haunted-cost-guard/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API documentation
    location /api-docs/ {
        proxy_pass http://localhost:3001/api-docs/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🐳 Docker Deployment

### 1. Docker Configuration

**Dockerfile (Frontend):**
```dockerfile
# Frontend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Dockerfile (Backend):**
```dockerfile
# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy source code
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Build application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S haunted -u 1001

# Create log directory
RUN mkdir -p /var/log/haunted-api && chown haunted:nodejs /var/log/haunted-api

USER haunted

EXPOSE 3001

CMD ["node", "dist/server.js"]
```

### 2. Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://backend:3001/api

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - FRONTEND_URL=http://frontend
      - LOG_LEVEL=info
    volumes:
      - ./logs:/var/log/haunted-api
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
```

### 3. Docker Commands

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale backend instances
docker-compose up -d --scale backend=3

# Update services
docker-compose pull
docker-compose up -d

# Stop services
docker-compose down
```

## ☁️ Cloud Deployment Options

### AWS Deployment

#### Using AWS ECS

**task-definition.json:**
```json
{
  "family": "haunted-cost-guard",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/hauntedCostGuardTaskRole",
  "containerDefinitions": [
    {
      "name": "haunted-backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/haunted-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "AWS_REGION",
          "value": "us-east-1"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/haunted-cost-guard",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Using AWS Lambda (Serverless)

**serverless.yml:**
```yaml
service: haunted-cost-guard

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  
functions:
  api:
    handler: backend/dist/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
    environment:
      NODE_ENV: production
      AWS_REGION: ${self:provider.region}

resources:
  Resources:
    # S3 bucket for frontend hosting
    FrontendBucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: haunted-cost-guard-${self:provider.stage}
        WebsiteConfiguration:
          IndexDocument: index.html
          ErrorDocument: index.html
```

### Vercel Deployment

**vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "backend/src/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/src/server.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Netlify Deployment

**netlify.toml:**
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/api/*"
  to = "https://your-backend-api.com/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 📊 Monitoring and Logging

### Application Monitoring

#### Health Checks

The application provides several health check endpoints:

```bash
# Basic health check
curl http://localhost:3001/health

# Detailed system status
curl http://localhost:3001/api/cost/health

# Cache statistics
curl http://localhost:3001/api/cost/aws/cache-stats
```

#### Logging Configuration

**Winston Logger Setup:**
```javascript
// backend/src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'haunted-cost-guard' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

#### Performance Monitoring

**Frontend Performance:**
```javascript
// Performance monitoring setup
if ('performance' in window) {
  // Monitor Core Web Vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
  });
}
```

### External Monitoring Services

#### Sentry Integration

**Frontend:**
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

**Backend:**
```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

## 🔒 Security Considerations

### Environment Security

1. **Never commit sensitive data to version control**
2. **Use environment variables for all secrets**
3. **Implement proper CORS policies**
4. **Use HTTPS in production**
5. **Regularly update dependencies**

### AWS Security

**IAM Policy (Minimal Permissions):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetUsageReport",
        "ce:ListCostCategoryDefinitions",
        "budgets:ViewBudget"
      ],
      "Resource": "*"
    }
  ]
}
```

### Security Headers

**Helmet.js Configuration:**
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.aws.amazon.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## 🔧 Troubleshooting

### Common Deployment Issues

#### Build Failures

**Issue**: TypeScript compilation errors
```bash
# Solution: Check TypeScript configuration
npx tsc --noEmit
npm run build
```

**Issue**: Missing dependencies
```bash
# Solution: Clean install
rm -rf node_modules package-lock.json
npm install
```

#### Runtime Issues

**Issue**: CORS errors in production
```bash
# Check CORS configuration in backend
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Issue**: API endpoints not accessible
```bash
# Verify reverse proxy configuration
nginx -t
systemctl reload nginx
```

#### Performance Issues

**Issue**: Slow API responses
```bash
# Check cache configuration
CACHE_TTL=600000  # Increase cache time
CACHE_MAX_SIZE=1000  # Increase cache size
```

**Issue**: High memory usage
```bash
# Monitor with PM2
pm2 monit
pm2 restart haunted-api
```

### Debugging Tools

```bash
# View application logs
tail -f /var/log/haunted-api/combined.log

# Monitor system resources
htop
df -h

# Check network connectivity
curl -I http://localhost:3001/health
netstat -tlnp | grep 3001

# Database/cache inspection
pm2 logs haunted-api --lines 100
```

### Recovery Procedures

**Service Recovery:**
```bash
# Restart services
pm2 restart all
systemctl restart nginx

# Rollback deployment
git checkout previous-stable-tag
npm run build
pm2 restart haunted-api
```

**Data Recovery:**
```bash
# Clear cache if corrupted
rm -rf backend/cache/*
pm2 restart haunted-api

# Reset to demo mode
export VITE_ENABLE_AWS_MODE=false
npm run build
```

---

*May your deployments be smooth and your haunted mansion always accessible! 👻🚀*