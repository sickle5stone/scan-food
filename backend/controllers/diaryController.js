const diaryService = require("../services/diaryService");

/**
 * Add a food item to the diary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addToDiary = async (req, res) => {
  try {
    const { foodItem, timestamp } = req.body;

    if (!foodItem || !foodItem.id || !foodItem.name) {
      return res.status(400).json({
        error: {
          message: "Invalid food item data",
        },
      });
    }

    const entry = diaryService.addToDiary(
      foodItem,
      timestamp ? new Date(timestamp) : undefined
    );
    res.status(201).json(entry);
  } catch (error) {
    console.error("Error adding to diary:", error);
    res.status(500).json({
      error: {
        message: "Failed to add food to diary",
      },
    });
  }
};

/**
 * Get diary entries for a specific date
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDiaryEntries = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const entries = diaryService.getDiaryEntries(targetDate);
    res.json(entries);
  } catch (error) {
    console.error("Error getting diary entries:", error);
    res.status(500).json({
      error: {
        message: "Failed to get diary entries",
      },
    });
  }
};

/**
 * Remove a diary entry
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const removeDiaryEntry = async (req, res) => {
  try {
    const { entryId } = req.params;

    const success = diaryService.removeDiaryEntry(entryId);
    if (!success) {
      return res.status(404).json({
        error: {
          message: "Diary entry not found",
        },
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error removing diary entry:", error);
    res.status(500).json({
      error: {
        message: "Failed to remove diary entry",
      },
    });
  }
};

module.exports = {
  addToDiary,
  getDiaryEntries,
  removeDiaryEntry,
};
