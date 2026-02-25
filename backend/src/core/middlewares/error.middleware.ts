import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import fs from 'fs';
import path from 'path';

export const errorMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Something went wrong!';
  let details = err.message;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Log error to file
  try {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    const errorLog = `[${new Date().toISOString()}] ${req.method} ${req.url}\n${err.stack}\n\n`;
    fs.appendFileSync(path.join(logDir, 'error.log'), errorLog);
  } catch (e) {
    console.error('Failed to write to error log:', e);
  }

  // Always log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    details: process.env.NODE_ENV === 'production' ? undefined : details,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
