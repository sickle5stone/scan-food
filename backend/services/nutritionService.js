const axios = require("axios");
const geminiService = require("./geminiService");

// Simple cache to avoid repeated API calls for the same food
const foodCache = new Map();

// Simple mock data for fallback when API fails completely
const fallbackFoods = {
  french_toast_with_egg: {
    id: "food_fallback_french_toast_with_egg",
    name: "French Toast with Fried Egg",
    imagePlaceholder: "🍞🍳",
    description:
      "Classic breakfast dish with egg-soaked bread and a fried egg on top",
    calories: 420,
    ingredients: [
      { name: "Bread", weight: "2 slices", calories: 160 },
      { name: "Eggs", weight: "2", calories: 140 },
      { name: "Milk", weight: "2 tbsp", calories: 20 },
      { name: "Butter", weight: "1 tbsp", calories: 100 },
    ],
    nutrients: [
      { name: "Carbs", amount: "35g", rda: "11.6%" },
      { name: "Protein", amount: "16g", rda: "32%" },
      { name: "Fat", amount: "24g", rda: "31%" },
      { name: "Fiber", amount: "1.5g", rda: "5.3%" },
      { name: "Sugar", amount: "6g", rda: "12%" },
    ],
  },
  breakfast: {
    id: "food_fallback_breakfast",
    name: "Breakfast Plate",
    imagePlaceholder: "🍳",
    description: "A breakfast plate with assorted items",
    calories: 450,
    ingredients: [
      { name: "Eggs", weight: "2", calories: 140 },
      { name: "Toast", weight: "2 slices", calories: 160 },
      { name: "Bacon", weight: "2 strips", calories: 90 },
      { name: "Butter", weight: "1 tbsp", calories: 100 },
    ],
    nutrients: [
      { name: "Carbs", amount: "40g", rda: "13.3%" },
      { name: "Protein", amount: "20g", rda: "40%" },
      { name: "Fat", amount: "30g", rda: "38.5%" },
      { name: "Fiber", amount: "2g", rda: "7.1%" },
      { name: "Sugar", amount: "4g", rda: "8%" },
    ],
  },
  default: {
    id: "food_fallback_default",
    name: "Food Item",
    imagePlaceholder: "🍽️",
    description: "A food item",
    calories: 250,
    ingredients: [
      { name: "Various ingredients", weight: "100g", calories: 250 },
    ],
    nutrients: [
      { name: "Carbs", amount: "25g", rda: "8.3%" },
      { name: "Protein", amount: "10g", rda: "20%" },
      { name: "Fat", amount: "8g", rda: "10.2%" },
      { name: "Fiber", amount: "3g", rda: "10.7%" },
      { name: "Sugar", amount: "5g", rda: "10%" },
    ],
  },
};

/**
 * Find the best matching fallback food based on the ID or name
 * @param {string} idOrName - Food ID or name to match
 * @returns {Object} The best matching fallback food data
 */
const findBestFallbackFood = (idOrName = "") => {
  const lowerIdOrName = idOrName.toLowerCase();

  if (
    lowerIdOrName.includes("french") &&
    (lowerIdOrName.includes("toast") || lowerIdOrName.includes("egg"))
  ) {
    return fallbackFoods.french_toast_with_egg;
  }

  if (
    lowerIdOrName.includes("breakfast") ||
    lowerIdOrName.includes("egg") ||
    lowerIdOrName.includes("toast") ||
    lowerIdOrName.includes("bread")
  ) {
    return fallbackFoods.breakfast;
  }

  return fallbackFoods.default;
};

/**
 * Fetch or use cached data about a food item using Gemini
 * @param {string} id - Food ID or recognized food name
 * @returns {Promise<Object>} Food details with nutritional information
 */
const getFoodDetails = async (id) => {
  // Extract the food name from the ID if it's a generated ID
  const foodName = id.includes("food_")
    ? id.split("_").slice(2).join("_").replace(/_/g, " ")
    : id;

  // First check if we have cached this item
  if (foodCache.has(id)) {
    console.log(`Using cached data for food: ${id}`);
    return foodCache.get(id);
  }

  try {
    // Use Gemini to get nutritional information
    const geminiData = await geminiService.getNutritionalInfo(foodName);

    // Format the data to match the expected frontend structure
    const foodDetails = formatNutritionalData(id, geminiData);

    // Cache the results
    foodCache.set(id, foodDetails);
    return foodDetails;
  } catch (error) {
    console.error(`Error fetching food details for ID ${id}:`, error);

    // Return a fallback food item
    const fallbackFood = findBestFallbackFood(foodName);
    fallbackFood.id = id; // Use the original ID

    // Cache the fallback to avoid repeated failures
    foodCache.set(id, fallbackFood);

    return fallbackFood;
  }
};

/**
 * Search for food items by name
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching food items
 */
const searchFood = async (query) => {
  try {
    // Normalize query
    const normalizedQuery = query.toLowerCase().trim();

    // First check cached items
    const cachedResults = [];
    for (const [id, food] of foodCache.entries()) {
      if (food.name.toLowerCase().includes(normalizedQuery)) {
        cachedResults.push({
          id,
          name: food.name,
          calories: food.calories,
          imagePlaceholder: food.imagePlaceholder || "🍽️",
        });
      }
    }

    // If we have local results, return them
    if (cachedResults.length > 0) {
      return cachedResults;
    }

    // Generate a unique ID for this search term
    const searchId = `food_${Date.now()}_${normalizedQuery.replace(
      /\s+/g,
      "_"
    )}`;

    try {
      // Get nutritional info for the search term from Gemini
      const geminiData = await geminiService.getNutritionalInfo(
        normalizedQuery
      );

      // Format and cache the data
      const foodDetails = formatNutritionalData(searchId, geminiData);
      foodCache.set(searchId, foodDetails);

      // Return a simplified version for the search results
      return [
        {
          id: searchId,
          name: foodDetails.name,
          calories: foodDetails.calories,
          imagePlaceholder: foodDetails.imagePlaceholder,
        },
      ];
    } catch (error) {
      console.error("Error in Gemini food search:", error);

      // Return a fallback food item
      const fallbackFood = findBestFallbackFood(normalizedQuery);

      // Modify ID to include the search term
      const fallbackId = `food_${Date.now()}_${normalizedQuery.replace(
        /\s+/g,
        "_"
      )}`;

      // Add to cache
      foodCache.set(fallbackId, {
        ...fallbackFood,
        id: fallbackId,
        name:
          normalizedQuery.charAt(0).toUpperCase() + normalizedQuery.slice(1),
      });

      return [
        {
          id: fallbackId,
          name:
            normalizedQuery.charAt(0).toUpperCase() + normalizedQuery.slice(1),
          calories: fallbackFood.calories,
          imagePlaceholder: fallbackFood.imagePlaceholder,
        },
      ];
    }
  } catch (error) {
    console.error("Error in food search:", error);
    // Return a basic result if there's an error
    return [
      {
        id: `search-${Date.now()}`,
        name: `Search results for: ${query}`,
        calories: 0,
        imagePlaceholder: "🔍",
      },
    ];
  }
};

/**
 * Format nutritional data to match the expected frontend structure
 * @param {string} id - Food ID
 * @param {Object} geminiData - Raw data from Gemini
 * @returns {Object} Formatted food details
 */
const formatNutritionalData = (id, geminiData) => {
  // Select an emoji based on the food name
  const imagePlaceholder = selectFoodEmoji(geminiData.foodName);

  // Convert nutrients to the format expected by the frontend
  const nutrients = [
    {
      name: "Carbs",
      amount: `${geminiData.nutrients.carbs}g`,
      rda: `${geminiData.rdaPercentages.carbs}%`,
    },
    {
      name: "Protein",
      amount: `${geminiData.nutrients.protein}g`,
      rda: `${geminiData.rdaPercentages.protein}%`,
    },
    {
      name: "Fat",
      amount: `${geminiData.nutrients.fat}g`,
      rda: `${geminiData.rdaPercentages.fat}%`,
    },
    {
      name: "Fiber",
      amount: `${geminiData.nutrients.fiber}g`,
      rda: `${geminiData.rdaPercentages.fiber}%`,
    },
    {
      name: "Sugar",
      amount: `${geminiData.nutrients.sugar}g`,
      rda: `${geminiData.rdaPercentages.sugar}%`,
    },
  ];

  // Convert ingredients to the format expected by the frontend
  const ingredients = geminiData.ingredients.map((ingredient, index) => ({
    name: ingredient,
    weight: index === 0 ? "100g" : "varies", // Primary ingredient is 100g, others vary
    calories:
      index === 0
        ? geminiData.calories
        : Math.round(geminiData.calories / geminiData.ingredients.length),
  }));

  return {
    id,
    name: geminiData.foodName,
    description: geminiData.description,
    imagePlaceholder,
    calories: geminiData.calories,
    ingredients,
    nutrients,
  };
};

/**
 * Choose an appropriate food emoji based on food name
 * @param {string} foodName - Name of the food
 * @returns {string} Food emoji
 */
const selectFoodEmoji = (foodName) => {
  const name = foodName.toLowerCase();

  // Basic mapping of food types to emojis
  if (name.includes("apple")) return "🍎";
  if (name.includes("banana")) return "🍌";
  if (name.includes("orange")) return "🍊";
  if (name.includes("grape")) return "🍇";
  if (name.includes("watermelon")) return "🍉";
  if (name.includes("lemon")) return "🍋";
  if (name.includes("strawberry")) return "🍓";
  if (name.includes("pear")) return "🍐";
  if (name.includes("peach")) return "🍑";
  if (name.includes("cherry")) return "🍒";
  if (name.includes("pineapple")) return "🍍";
  if (name.includes("kiwi")) return "🥝";
  if (name.includes("tomato")) return "🍅";
  if (name.includes("coconut")) return "🥥";
  if (name.includes("avocado")) return "🥑";
  if (name.includes("eggplant") || name.includes("aubergine")) return "🍆";
  if (name.includes("potato")) return "🥔";
  if (name.includes("carrot")) return "🥕";
  if (name.includes("corn")) return "🌽";
  if (name.includes("pepper") || name.includes("chili")) return "🌶️";
  if (name.includes("broccoli")) return "🥦";
  if (name.includes("garlic")) return "🧄";
  if (name.includes("onion")) return "🧅";
  if (name.includes("mushroom")) return "🍄";
  if (name.includes("salad") || name.includes("lettuce")) return "🥬";
  if (name.includes("cucumber")) return "🥒";
  if (name.includes("bread") || name.includes("toast")) return "🍞";
  if (name.includes("croissant")) return "🥐";
  if (name.includes("baguette")) return "🥖";
  if (name.includes("pretzel")) return "🥨";
  if (name.includes("bagel")) return "🥯";
  if (name.includes("pancake")) return "🥞";
  if (name.includes("waffle")) return "🧇";
  if (name.includes("cheese")) return "🧀";
  if (name.includes("egg")) return "🥚";
  if (name.includes("butter")) return "🧈";
  if (name.includes("meat")) return "🍖";
  if (name.includes("chicken")) return "🍗";
  if (name.includes("bacon")) return "🥓";
  if (name.includes("burger") || name.includes("hamburger")) return "🍔";
  if (name.includes("pizza")) return "🍕";
  if (name.includes("sandwich")) return "🥪";
  if (name.includes("hot dog") || name.includes("hotdog")) return "🌭";
  if (name.includes("taco")) return "🌮";
  if (name.includes("burrito")) return "🌯";
  if (name.includes("rice")) return "🍚";
  if (name.includes("pasta") || name.includes("spaghetti")) return "🍝";
  if (name.includes("soup")) return "🍲";
  if (name.includes("curry")) return "🍛";
  if (name.includes("bento")) return "🍱";
  if (name.includes("sushi")) return "🍣";
  if (name.includes("fish")) return "🐟";
  if (
    name.includes("seafood") ||
    name.includes("prawn") ||
    name.includes("shrimp")
  )
    return "🦐";
  if (name.includes("cake")) return "🍰";
  if (name.includes("cookie")) return "🍪";
  if (name.includes("chocolate")) return "🍫";
  if (name.includes("candy")) return "🍬";
  if (name.includes("lollipop")) return "🍭";
  if (name.includes("ice cream")) return "🍦";
  if (name.includes("donut")) return "🍩";
  if (name.includes("drink") || name.includes("beverage")) return "🥤";
  if (name.includes("coffee")) return "☕";
  if (name.includes("tea")) return "🍵";
  if (name.includes("wine")) return "🍷";
  if (name.includes("beer")) return "🍺";
  if (name.includes("milk")) return "🥛";

  // Default food emoji if no match found
  return "🍽️";
};

module.exports = {
  getFoodDetails,
  searchFood,
};
