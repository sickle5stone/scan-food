// In-memory storage for diary entries (replace with database in production)
const diaryEntries = new Map();

/**
 * Add a food item to the diary
 * @param {Object} foodItem - The food item to add
 * @param {string} foodItem.id - Unique identifier for the food
 * @param {string} foodItem.name - Name of the food
 * @param {number} foodItem.calories - Calories per serving
 * @param {Object} foodItem.nutrients - Nutrient information
 * @param {string} [foodItem.mealType] - Type of meal (breakfast, lunch, dinner, snack)
 * @param {Date} [timestamp] - When the food was consumed (defaults to now)
 * @returns {Object} The created diary entry
 */
const addToDiary = (foodItem, timestamp = new Date()) => {
  const entryId = `entry_${Date.now()}`;
  const entry = {
    id: entryId,
    foodId: foodItem.id,
    name: foodItem.name,
    calories: foodItem.calories,
    nutrients: foodItem.nutrients,
    mealType: foodItem.mealType || "other",
    timestamp: timestamp.toISOString(),
    createdAt: new Date().toISOString(),
  };

  diaryEntries.set(entryId, entry);
  return entry;
};

/**
 * Get diary entries for a specific date
 * @param {Date} date - The date to get entries for
 * @returns {Array} Array of diary entries
 */
const getDiaryEntries = (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return Array.from(diaryEntries.values())
    .filter((entry) => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startOfDay && entryDate <= endOfDay;
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

/**
 * Remove a diary entry
 * @param {string} entryId - ID of the entry to remove
 * @returns {boolean} Whether the entry was successfully removed
 */
const removeDiaryEntry = (entryId) => {
  return diaryEntries.delete(entryId);
};

module.exports = {
  addToDiary,
  getDiaryEntries,
  removeDiaryEntry,
};
