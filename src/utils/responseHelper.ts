import { Response } from "express";

export const sendSuccess = (
    res: Response,
    data: unknown,
    message = "Success",
    statusCode = 200
  ): void => {
    res.status(statusCode).json({
      status: "success",
      statusCode,
      message,
      data,
    });
  };
  
  export const sendError = (
    res: Response,
    errorMessage: string,
    statusCode = 400
  ): void => {
    res.json({
      statusCode,
      status: "error",
      message: errorMessage,
    });
  };
