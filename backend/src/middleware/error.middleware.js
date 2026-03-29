const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Default error object
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // Specific error handling
  if (err.name === "SyntaxError" && err.status === 400) {
    statusCode = 400;
    message = "Invalid JSON format";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  }

  res.status(statusCode).json({
    message,
    error: process.env.NODE_ENV === "development" ? err : undefined,
  });
};

module.exports = { errorHandler };
