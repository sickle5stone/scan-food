/**
 * Middleware to validate image format and size
 */
const validateImageFormat = (req, res, next) => {
  // Check if an image file was uploaded
  if (!req.file) {
    return res.status(400).json({
      error: {
        message: "No image file provided",
        status: 400,
      },
    });
  }

  // Basic validation already handled by multer, but we can add more specific checks
  const validMimeTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!validMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      error: {
        message:
          "Invalid image format. Please upload JPEG, PNG, or WebP images.",
        status: 400,
      },
    });
  }

  next();
};

/**
 * Middleware to validate nutritional data parameters
 */
const validateNutritionalParams = (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      error: {
        message: "Food ID is required",
        status: 400,
      },
    });
  }

  // Additional validation could be added here

  next();
};

module.exports = {
  validateImageFormat,
  validateNutritionalParams,
};
