import { Request, Response, NextFunction } from "express";
import prisma from "../prisma";
import { z } from "zod";
import { CustomError } from "../utils/customError";
import logger from "../utils/logger";
import { sendSuccess, sendError } from "../utils/responseHelper";

const taskSchema = z.object({
  title: z.string().nonempty("Title is required"),
  color: z.string(),
  completed: z.boolean().optional(),
});

// Get all tasks
export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tasks = await prisma.task.findMany();
    logger.info(`Fetched ${tasks.length} tasks successfully.`);
    return sendSuccess(res, tasks, "Tasks retrieved successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error fetching tasks: ${message}`);
    next(sendError(res,"Failed to fetch tasks", 500));
  }
};

// Create a task
export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate input
    const { title, color } = taskSchema.parse(req.body);
    const normalizedTitle = title.trim().toLowerCase();

    // Check if task exists before creating
    const existingTask = await prisma.task.findUnique({
      where: { title: normalizedTitle },
    });

    if (existingTask) {
      return sendError(res,"A task with this title already exists. Please use a unique title",400);
    }

    // Create task
    const newTask = await prisma.task.create({
      data: { title: normalizedTitle, color },
    });

    logger.info(`Created a new task with ID: ${newTask.id}`);
    return sendSuccess(res, newTask, "Task created successfully", 201);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      next(sendError(res,error.errors[0].message, 400));
      return;
    }

    // Handle Prisma errors
    if (error instanceof Error && 'code' in error) {
      switch (error.code) {
        case 'P2002':
          next(sendError(res,
            "A task with this title already exists. Please use a unique title.",
            400
          ));
          return;
        default:
          logger.error(`Database error: ${error.message}`);
          next(sendError(res,"Failed to create task", 500));
          return;
      }
    }

    // Handle unexpected errors
    logger.error(`Unexpected error creating task: ${error}`);
    next(sendError(res,"Failed to create task", 500));
  }
};

// Update a task
export const updateTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: Number(id) },
    });
    
    if (!existingTask) {
      logger.warn(`Task with ID ${id} not found for update.`);
      sendError(res,"Task not found", 404);
      return;
    }

    const validatedData = taskSchema.partial().parse(req.body);
    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: validatedData,
    });

    logger.info(`Task with ID ${id} updated successfully.`);
    return sendSuccess(res, updatedTask, "Task updated successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error updating task with ID ${id}: ${message}`);
    
    if (error instanceof z.ZodError) {
      sendError(res,error.errors[0].message, 400);
      return;
    }
    next(sendError(res,"Failed to update task", 500));
  }
};

// Delete a task
export const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: Number(id) },
    });
    
    if (!existingTask) {
      logger.warn(`Task with ID ${id} not found for deletion.`);
      sendError(res,"Task not found", 404);
      return;
    }

    await prisma.task.delete({ where: { id: Number(id) } });
    logger.info(`Task with ID ${id} deleted successfully.`);
    return sendSuccess(res, null, "Task deleted successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error deleting task with ID ${id}: ${message}`);
    next(sendError(res,"Failed to delete task", 500));
  }
};