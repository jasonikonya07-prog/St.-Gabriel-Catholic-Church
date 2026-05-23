import { ValidationError, UniqueConstraintError } from "sequelize";
import ApiError from "../utils/ApiError.js";

function getSequelizeDetails(error) {
  return error.errors?.map((item) => ({
    field: item.path,
    message: item.message,
  }));
}

function normalizeError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof ValidationError || error instanceof UniqueConstraintError) {
    return new ApiError(400, "Validation failed. Please check your information.", getSequelizeDetails(error));
  }

  if (error.type === "entity.too.large") {
    return new ApiError(413, "Request body is too large.");
  }

  if (error instanceof SyntaxError && "body" in error) {
    return new ApiError(400, "Invalid JSON request body.");
  }

  if (error.message === "This origin is not allowed by CORS.") {
    return new ApiError(403, "This website is not allowed to access the API.");
  }

  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
    return new ApiError(401, "Invalid or expired admin session.");
  }

  return error;
}

export function notFound(request, response, next) {
  next(new ApiError(404, `Route not found: ${request.originalUrl}`));
}

export function errorHandler(error, request, response, next) {
  const normalizedError = normalizeError(error);
  const isProduction = process.env.NODE_ENV === "production";
  const statusCode = normalizedError.statusCode || 500;
  const isSafeError = normalizedError.isOperational || statusCode < 500;

  if (!isProduction || statusCode >= 500) {
    console.error(normalizedError);
  }

  response.status(statusCode).json({
    details: normalizedError.details || undefined,
    message: isSafeError ? normalizedError.message : "Internal server error.",
    requestId: request.id || undefined,
    stack: isProduction ? undefined : normalizedError.stack,
    status: normalizedError.status || (statusCode < 500 ? "fail" : "error"),
    success: false,
  });
}
