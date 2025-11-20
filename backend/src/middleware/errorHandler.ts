import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = error.statusCode || 500;
  
  // 일반적인 브라우저 요청이나 404 에러는 로그를 간소화
  const commonBrowserRequests = ['/favicon.ico', '/robots.txt', '/sitemap.xml'];
  const isCommonRequest = commonBrowserRequests.some(path => req.url.includes(path));
  
  if (statusCode === 404 && isCommonRequest) {
    // 일반적인 브라우저 요청은 조용히 처리
    return res.status(404).end();
  }
  
  // 실제 에러만 로그 출력
  if (statusCode >= 500) {
    console.error('Server Error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  } else if (statusCode === 404) {
    console.warn(`404 Not Found: ${req.method} ${req.url}`);
  }

  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: error.stack })
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 일반적인 브라우저 요청들은 조용히 처리
  const commonBrowserRequests = ['/favicon.ico', '/robots.txt', '/sitemap.xml'];
  
  if (commonBrowserRequests.includes(req.originalUrl)) {
    return res.status(404).end();
  }

  const error: ApiError = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};