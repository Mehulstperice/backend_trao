export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  console.error(error);

  if (error.name === "ZodError") {
    return res.status(400).json({ message: "Validation failed", issues: error.issues });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "Email is already registered" });
  }

  res.status(error.status || 500).json({
    message: error.message || "Something went wrong"
  });
}
