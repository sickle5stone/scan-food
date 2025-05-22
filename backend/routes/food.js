const express = require("express");
const router = express.Router();
const multer = require("multer");
const foodController = require("../controllers/foodController");
const { validateImageFormat } = require("../middleware/validators");

// Configure multer for image uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

/**
 * @route POST /api/food/recognize
 * @desc Recognize food from an uploaded image using Gemini AI
 */
router.post(
  "/recognize",
  upload.single("image"),
  validateImageFormat,
  foodController.recognizeFood
);

/**
 * @route GET /api/food/:id
 * @desc Get detailed nutritional information for a food item
 */
router.get("/:id", foodController.getFoodDetails);

/**
 * @route GET /api/food/search/:query
 * @desc Search for food items by name
 */
router.get("/search/:query", foodController.searchFood);

module.exports = router;
