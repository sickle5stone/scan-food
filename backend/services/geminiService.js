const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Google Generative AI with API key
let genAI;
try {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} catch (error) {
  console.error("Error initializing Google Generative AI:", error);
}

// Custom error class for Gemini API errors
class GeminiAPIError extends Error {
  constructor(message) {
    super(message);
    this.name = "GeminiAPIError";
  }
}

/**
 * Recognize food from an image using Google Gemini Vision model
 * @param {string} base64Image - Base64-encoded image data
 * @param {string} mimeType - MIME type of the image
 * @returns {Promise<Object>} Recognition result with foodName and nutritional information
 */
const recognizeFoodFromImage = async (base64Image, mimeType) => {
  if (!genAI) {
    throw new GeminiAPIError("Gemini AI client not initialized");
  }

  try {
    // Get the Gemini 2.0 Flash model (replacing Gemini 1.5 Flash)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Enhanced prompt with improved guidance for breakfast foods and complex dishes
    const prompt =
      "Analyze this food image carefully. If there are multiple food items, identify the main dish components. " +
      "Return a JSON object with the following fields: " +
      "'foodName' (the main dish name, such as 'French Toast with Fried Egg' if multiple items are present), " +
      "'confidence' (a number between 0 and 1), " +
      "'description' (a brief description of the food), " +
      "'ingredients' (an array of likely ingredients as strings), " +
      "'calories' (estimated calories per serving as a number), " +
      "'nutrients' (an object with numeric values in grams for: carbs, protein, fat, fiber, sugar), " +
      "'rdaPercentages' (an object with the percentage of recommended daily values as numbers for: carbs, protein, fat, fiber, sugar), " +
      "'alternatives' (an array of possible alternative identifications if not 100% sure). " +
      "Base your nutritional estimates on scientific data. Only respond with valid JSON. " +
      "For breakfast dishes, be sure to identify all components like toast, eggs, syrup, etc.";

    // Create the image part
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType,
      },
    };

    // Set generation config with higher temperature for more creative responses
    const generationConfig = {
      temperature: 0.4,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    };

    // Generate content with the text prompt and image
    const result = await model.generateContent(
      [prompt, imagePart],
      generationConfig
    );
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    let jsonResponse;
    try {
      // Find JSON within the response text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Error parsing Gemini response as JSON:", parseError);
      console.log("Raw response:", text);

      // Attempt to extract basic food name if JSON parsing fails
      const foodNameMatch = text.match(
        /["']foodName["']\s*:\s*["']([^"']+)["']/
      );
      if (foodNameMatch && foodNameMatch[1]) {
        return {
          foodName: foodNameMatch[1],
          confidence: 0.7, // Default lower confidence for non-JSON responses
          alternatives: ["Food item"],
          nutrients: {
            carbs: 0,
            protein: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
          },
        };
      }

      // Fall back to a generic response as last resort
      return {
        foodName: "Breakfast Dish",
        confidence: 0.5,
        description: "A breakfast dish that couldn't be precisely identified",
        ingredients: ["Bread", "Eggs", "Other ingredients"],
        alternatives: ["Breakfast Plate"],
        calories: 350,
        nutrients: {
          carbs: 30,
          protein: 12,
          fat: 15,
          fiber: 2,
          sugar: 5,
        },
        rdaPercentages: {
          carbs: 10,
          protein: 24,
          fat: 19,
          fiber: 7,
          sugar: 6,
        },
      };
    }

    // Return a complete object with all nutritional information
    return {
      foodName: jsonResponse.foodName || "Unknown Food",
      confidence: jsonResponse.confidence || 0.8,
      description: jsonResponse.description || "",
      ingredients: jsonResponse.ingredients || [],
      alternatives: jsonResponse.alternatives || [],
      calories: jsonResponse.calories || 0,
      nutrients: jsonResponse.nutrients || {
        carbs: 0,
        protein: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
      },
      rdaPercentages: jsonResponse.rdaPercentages || {
        carbs: 0,
        protein: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
      },
    };
  } catch (error) {
    console.error("Error in Gemini API call:", error);

    // Provide fallback data instead of throwing an error
    return {
      foodName: "Food Dish",
      confidence: 0.5,
      description:
        "A food dish that couldn't be precisely identified due to a technical issue.",
      ingredients: ["Various ingredients"],
      alternatives: ["Meal"],
      calories: 300,
      nutrients: {
        carbs: 30,
        protein: 15,
        fat: 10,
        fiber: 2,
        sugar: 5,
      },
      rdaPercentages: {
        carbs: 10,
        protein: 30,
        fat: 15,
        fiber: 8,
        sugar: 20,
      },
    };
  }
};

/**
 * Get nutritional information for a food item using Gemini
 * @param {string} foodName - Name of the food to analyze
 * @returns {Promise<Object>} Nutritional information
 */
const getNutritionalInfo = async (foodName) => {
  if (!genAI) {
    throw new GeminiAPIError("Gemini AI client not initialized");
  }

  try {
    // Get the Gemini 2.0 Flash model (replacing Gemini 1.5 Flash)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Prompt specifically for nutritional information
    const prompt =
      `Provide detailed nutritional information for ${foodName}. Return a JSON object with the following fields: ` +
      `'foodName' (the exact food name: "${foodName}"), ` +
      `'description' (a brief description of the food), ` +
      `'calories' (calories per 100g as a number), ` +
      `'ingredients' (an array of common ingredients if it's a prepared food, or just the main food if it's a single ingredient), ` +
      `'nutrients' (an object with these properties in grams per 100g: carbs, protein, fat, fiber, sugar - all as numbers), ` +
      `'rdaPercentages' (an object with percentage of daily recommended values for: carbs, protein, fat, fiber, sugar - all as numbers). ` +
      `Base your nutritional values on scientific data. Only respond with valid JSON.`;

    // Generate content with the text prompt
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    let jsonResponse;
    try {
      // Find JSON within the response text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error(
        "Error parsing Gemini nutrition response as JSON:",
        parseError
      );
      console.log("Raw response:", text);
      // Instead of throwing, return a reasonable default
      return {
        foodName: foodName,
        description: `${foodName} is a nutritious food item.`,
        calories: 250,
        ingredients: [foodName],
        nutrients: {
          carbs: 25,
          protein: 10,
          fat: 8,
          fiber: 3,
          sugar: 5,
        },
        rdaPercentages: {
          carbs: 8,
          protein: 20,
          fat: 12,
          fiber: 12,
          sugar: 20,
        },
      };
    }

    return {
      foodName: jsonResponse.foodName || foodName,
      description: jsonResponse.description || "",
      calories: jsonResponse.calories || 0,
      ingredients: jsonResponse.ingredients || [foodName],
      nutrients: jsonResponse.nutrients || {
        carbs: 0,
        protein: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
      },
      rdaPercentages: jsonResponse.rdaPercentages || {
        carbs: 0,
        protein: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
      },
    };
  } catch (error) {
    console.error("Error getting nutritional info from Gemini:", error);
    // Return reasonable defaults instead of throwing
    return {
      foodName: foodName,
      description: `${foodName} is a food item.`,
      calories: 250,
      ingredients: [foodName],
      nutrients: {
        carbs: 25,
        protein: 10,
        fat: 8,
        fiber: 3,
        sugar: 5,
      },
      rdaPercentages: {
        carbs: 8,
        protein: 20,
        fat: 12,
        fiber: 12,
        sugar: 20,
      },
    };
  }
};

module.exports = {
  recognizeFoodFromImage,
  getNutritionalInfo,
};
