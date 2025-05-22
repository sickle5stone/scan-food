const express = require("express");
const router = express.Router();
const diaryController = require("../controllers/diaryController");

// Add a food item to the diary
router.post("/entries", diaryController.addToDiary);

// Get diary entries for a specific date
router.get("/entries", diaryController.getDiaryEntries);

// Remove a diary entry
router.delete("/entries/:entryId", diaryController.removeDiaryEntry);

module.exports = router;
