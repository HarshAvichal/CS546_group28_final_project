export const errorHandler = (err, req, res, next) => {
    // Log the error details for debugging
    console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        status: err.status || 500,
    });

    // Set a default status code and message if not already set
    const statusCode = err.status || 500;
    const message = err.message || "Internal Server Error";

    // Check for specific error types (e.g., validation errors)
    if (err.name === "ValidationError") {
        return res.status(400).json({ 
            error: "Validation Error", 
            details: err.errors 
        });
    }

    // Handle MongoDB CastError (e.g., invalid ObjectId)
    if (err.name === "CastError" && err.kind === "ObjectId") {
        return res.status(400).json({ 
            error: "Invalid ID format", 
            details: err.message 
        });
    }

    // Handle JWT-related errors
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ 
            error: "Invalid token", 
            details: "The provided token is invalid or malformed." 
        });
    }

    if (err.name === "TokenExpiredError") {
        return res.status(401).json({ 
            error: "Token expired", 
            details: "The provided token has expired. Please log in again." 
        });
    }

    // Default error response for unhandled errors
    res.status(statusCode).json({
        error: message,
        // Include stack trace in development mode for debugging purposes
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};
