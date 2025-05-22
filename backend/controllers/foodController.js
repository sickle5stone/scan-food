const geminiService = require("../services/geminiService");
const nutritionService = require("../services/nutritionService");
const { getUniqueId } = require("../utils/helpers");

/**
 * Recognize food from an image using Gemini AI
 */
const recognizeFood = async (req, res, next) => {
  try {
    // Get image data from the request
    const imageBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    // Convert buffer to base64 for Gemini API
    const base64Image = imageBuffer.toString("base64");

    // Call Gemini service to recognize food
    const recognitionResult = await geminiService.recognizeFoodFromImage(
      base64Image,
      mimeType
    );

    if (!recognitionResult || !recognitionResult.foodName) {
      return res.status(400).json({
        error: {
          message: "Unable to recognize food in the image",
          status: 400,
        },
      });
    }

    // Generate a unique ID for this food item that includes the food name
    const foodName = recognitionResult.foodName
      .toLowerCase()
      .replace(/\s+/g, "_");
    const foodId = `food_${Date.now()}_${foodName}`;

    // Format the nutritional data we directly get from Gemini for a quick preview
    // The full details can be fetched with getFoodDetails later
    const previewData = {
      id: foodId,
      name: recognitionResult.foodName,
      confidence: recognitionResult.confidence || 0.8,
      possibleAlternatives: recognitionResult.alternatives || [],
      description: recognitionResult.description || "",
      calories: recognitionResult.calories || 0,
      // Include a preview of the nutritional data
      nutrients: recognitionResult.nutrients
        ? {
            carbs: recognitionResult.nutrients.carbs || 0,
            protein: recognitionResult.nutrients.protein || 0,
            fat: recognitionResult.nutrients.fat || 0,
          }
        : null,
      message: "Food recognized successfully",
    };

    // Return recognized food data
    return res.status(200).json(previewData);
  } catch (error) {
    console.error("Error recognizing food:", error);
    if (error.name === "GeminiAPIError") {
      return res.status(503).json({
        error: {
          message: "Gemini AI service is currently unavailable",
          status: 503,
        },
      });
    }
    next(error);
  }
};

/**
 * Get detailed nutritional information for a food item
 */
const getFoodDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Fetch the food details from the nutrition service (uses Gemini)
    const foodDetails = await nutritionService.getFoodDetails(id);

    if (!foodDetails) {
      return res.status(404).json({
        error: {
          message: "Food details not found",
          status: 404,
        },
      });
    }

    return res.status(200).json(foodDetails);
  } catch (error) {
    console.error("Error fetching food details:", error);
    next(error);
  }
};

/**
 * Search for food items by name
 */
const searchFood = async (req, res, next) => {
  try {
    const { query } = req.params;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: {
          message: "Search query must be at least 2 characters",
          status: 400,
        },
      });
    }

    // Search for food items using the nutrition service
    const searchResults = await nutritionService.searchFood(query);

    return res.status(200).json({
      results: searchResults,
      count: searchResults.length,
      query,
    });
  } catch (error) {
    console.error("Error searching for food:", error);
    next(error);
  }
};

module.exports = {
  recognizeFood,
  getFoodDetails,
  searchFood,
};
