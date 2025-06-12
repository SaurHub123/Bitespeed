import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export interface ApiError extends Error {
  statusCode?: number;
  details?: any;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    details: error.details
  });

  // Handle Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    return handlePrismaError(error, res);
  }

  // Handle validation errors
  if (error.message.includes('validation')) {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      details: error.details
    });
  }

  // Handle not found errors
  if (error.message.includes('not found')) {
    return res.status(404).json({
      error: 'Not Found',
      message: error.message
    });
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    error: 'Internal Server Error',
    message: error.message
  });
};

const handlePrismaError = (error: PrismaClientKnownRequestError, res: Response) => {
  switch (error.code) {
    case 'P2002': // Unique constraint violation
      return res.status(409).json({
        error: 'Conflict',
        message: 'Resource already exists'
      });
    case 'P2025': // Record not found
      return res.status(404).json({
        error: 'Not Found',
        message: 'Resource not found'
      });
    case 'P2003': // Foreign key constraint violation
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid reference to related resource'
      });
    default:
      return res.status(500).json({
        error: 'Database Error',
        message: 'An unexpected database error occurred'
      });
  }
};