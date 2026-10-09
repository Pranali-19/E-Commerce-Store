import multer from "multer";

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;

  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || res.statusCode;

  if (!statusCode || statusCode === 200) {
    statusCode = 500;
  }

  let message = err.message || "Internal server error.";
  let errors = Array.isArray(err.errors) ? err.errors : [];
  
  // -----------------------------------------
  // Mongoose validation error
  // -----------------------------------------
  if (err.name === "ValidationError") {
    statusCode = 400;

    errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));

    message = "Validation failed.";
  }

  // -----------------------------------------
  // Mongoose invalid ObjectId
  // -----------------------------------------
  else if (err.name === "CastError") {
    statusCode = 400;

    message = `Invalid ${err.path || "resource"} value.`;

    errors = [
      {
        field: err.path || "id",
        message,
      },
    ];
  }

  // -----------------------------------------
  // MongoDB duplicate key
  // -----------------------------------------
  else if (err.code === 11000) {
    statusCode = 409;

    const duplicateFields = Object.keys(err.keyValue || {});

    const field =
      duplicateFields.length > 0
        ? duplicateFields.join(", ")
        : "field";

    message = `A record with the same ${field} already exists.`;

    errors = duplicateFields.map((fieldName) => ({
      field: fieldName,
      message: `${fieldName} already exists.`,
    }));
  }

   // -----------------------------------------
// Multer upload errors
// -----------------------------------------
  else if (err instanceof multer.MulterError) {
    statusCode = 400;

    if (err.code === "LIMIT_FILE_SIZE") {
      message = "Image file size must not exceed 5 MB.";
    } else if (err.code === "LIMIT_FILE_COUNT") {
      message = "Too many files uploaded.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Unexpected file field.";
    } else {
      message = "Image upload failed.";
    }
  }

  // -----------------------------------------
  // JWT errors
  // -----------------------------------------
  else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token.";
  }

  else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token has expired.";
  }

  // -----------------------------------------
  // Express JSON body parsing error
  // -----------------------------------------
  else if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Invalid JSON request body.";
  }

  // -----------------------------------------
  // Production-safe response
  // -----------------------------------------
  const response = {
    success: false,
    message,
    errors,
  };

  // Only expose stack trace during development
  if (process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }
  res.status(statusCode).json(response);

};

export {
  notFound,
  errorHandler,
};