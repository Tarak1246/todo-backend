import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import taskRoutes from "./routes/taskRoutes";
import logger from "./utils/logger";
import { CustomError } from "./utils/customError";
import { sendError, sendSuccess } from "./utils/responseHelper";

// Extend Error interface to include Prisma error properties
interface PrismaError extends Error {
  code?: string;
  meta?: {
    target?: string[];
  };
}

const app = express();

// Middleware for CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Log all HTTP requests
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`[${req.method}] ${req.url}`);
  next();
});

// Routes
app.use("/tasks", taskRoutes);

// Root route
app.get("/", (req: Request, res: Response) => {
  logger.info("Accessed the root route.");
  sendSuccess(res, null, "Welcome to the Task Manager API");
});

// Handle 404 - Route Not Found
app.use((req: Request, res: Response) => {
  logger.warn(`404 - Route not found: [${req.method}] ${req.url}`);
  return sendError(res, "Route not found", 404);
});

// Centralized Error-Handling Middleware
app.use((err: Error | PrismaError | CustomError, req: Request, res: Response, next: NextFunction) => {
  // Handle Custom Errors
  if (err instanceof CustomError) {
    logger.warn(`CustomError: [${req.method}] ${req.url} - ${err.message}`);
    return sendError(res, err.message, err.statusCode);
  }

  // Handle Prisma Errors
  if ('code' in err) {
    switch (err.code) {
      case 'P2002': {
        const target = (err as PrismaError).meta?.target?.[0] || 'field';
        logger.error(
          `Prisma Constraint Violation: [${req.method}] ${req.url} - Duplicate ${target}`
        );
        return sendError(
          res,
          `A task with this ${target} already exists. Please use a unique value.`,
          400
        );
      }
      case 'P2025': {
        logger.error(
          `Prisma Not Found Error: [${req.method}] ${req.url} - ${err.message}`
        );
        return sendError(res, "Resource not found", 404);
      }
      default: {
        logger.error(
          `Prisma Error: [${req.method}] ${req.url} - ${err.code} - ${err.message}`
        );
        return sendError(res, "Database operation failed", 500);
      }
    }
  }

  // Handle all other errors
  logger.error(`Unhandled Error: [${req.method}] ${req.url} - ${err.message}`, {
    stack: err.stack,
    error: err
  });
  
  return sendError(
    res,
    process.env.NODE_ENV === 'production'
      ? "Something went wrong. Please try again later."
      : err.message || "Unknown error occurred",
    500
  );
});

// Start server
const PORT = process.env.PORT || 5000;

// Wrap server startup in try-catch for better error handling
try {
  app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
} catch (error) {
  logger.error('Failed to start server:', error);
  process.exit(1);
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason: Error | any) => {
  logger.error('Unhandled Rejection:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  // Give the logger time to write before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

export default app;