import "./Diary.css";

import {
  deleteDiaryEntry,
  getDiaryEntries,
  updateDiaryEntry,
  FoodDiaryEntry,
  MealType,
} from "../services/firestoreService";
import { useEffect, useState } from "react";
import {
  Trash2,
  Edit3,
  Save,
  X,
  Calendar,
  TrendingUp,
  Clock,
  Plus,
} from "lucide-react";

const Diary = () => {
  const [entries, setEntries] = useState<FoodDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FoodDiaryEntry>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Format date for input
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  // Format date for display
  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Fetch diary entries using Firestore
  const fetchEntries = async (date: Date) => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace 'current-user-id' with actual user ID from authentication
      const userId = "current-user-id";
      const firestoreEntries = await getDiaryEntries(userId, date);
      // Sort entries by time (most recent first)
      const sortedEntries = firestoreEntries.sort(
        (a, b) => b.date.toMillis() - a.date.toMillis()
      );
      setEntries(sortedEntries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch entries");
    } finally {
      setLoading(false);
    }
  };

  // Delete entry with confirmation
  const handleDelete = async (entryId: string) => {
    try {
      await deleteDiaryEntry(entryId);
      await fetchEntries(selectedDate);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    }
  };

  // Start editing
  const handleEdit = (entry: FoodDiaryEntry) => {
    setIsEditing(entry.id!);
    setEditForm({
      name: entry.name,
      calories: entry.calories,
      mealType: entry.mealType,
    });
  };

  // Save edit using Firestore
  const handleSaveEdit = async () => {
    if (!isEditing) return;

    try {
      await updateDiaryEntry(isEditing, {
        name: editForm.name,
        calories: editForm.calories,
        mealType: editForm.mealType as MealType,
      });
      setIsEditing(null);
      setEditForm({});
      await fetchEntries(selectedDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update entry");
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setIsEditing(null);
    setEditForm({});
  };

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
  };

  // Navigate to previous/next day
  const navigateDay = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    setSelectedDate(newDate);
  };

  // Get meal type emoji
  const getMealEmoji = (mealType: MealType) => {
    switch (mealType) {
      case "breakfast":
        return "🌅";
      case "lunch":
        return "☀️";
      case "dinner":
        return "🌙";
      case "snack":
        return "🍿";
      default:
        return "🍽️";
    }
  };

  // Get meal type label
  const getMealLabel = (mealType: MealType) => {
    switch (mealType) {
      case "breakfast":
        return "Breakfast";
      case "lunch":
        return "Lunch";
      case "dinner":
        return "Dinner";
      case "snack":
        return "Snack";
      default:
        return "Other";
    }
  };

  useEffect(() => {
    fetchEntries(selectedDate);
  }, [selectedDate]);

  const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
  const totalEntries = entries.length;

  // Calculate nutrition totals
  const nutritionTotals = entries.reduce(
    (totals, entry) => {
      entry.nutrients.forEach((nutrient) => {
        const amount = parseFloat(nutrient.amount) || 0;
        if (nutrient.name.toLowerCase().includes("protein")) {
          totals.protein += amount;
        } else if (nutrient.name.toLowerCase().includes("carb")) {
          totals.carbs += amount;
        } else if (nutrient.name.toLowerCase().includes("fat")) {
          totals.fat += amount;
        } else if (nutrient.name.toLowerCase().includes("fiber")) {
          totals.fiber += amount;
        }
      });
      return totals;
    },
    { protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  if (loading) {
    return (
      <div className="diary-loading">
        <div className="loading-spinner"></div>
        <p>Loading your food diary...</p>
      </div>
    );
  }

  return (
    <div className="diary-container">
      {/* Header Section */}
      <div className="diary-header">
        <div className="header-content">
          <h1>
            <Calendar className="header-icon" />
            Food Diary
          </h1>
          <p className="header-subtitle">
            {formatDateForDisplay(selectedDate)}
          </p>
        </div>

        <div className="date-navigation">
          <button
            onClick={() => navigateDay("prev")}
            className="nav-button"
            aria-label="Previous day"
          >
            ←
          </button>
          <input
            type="date"
            value={formatDateForInput(selectedDate)}
            onChange={handleDateChange}
            className="date-input"
          />
          <button
            onClick={() => navigateDay("next")}
            className="nav-button"
            aria-label="Next day"
          >
            →
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <X className="error-icon" />
          <p>{error}</p>
          <button onClick={() => setError(null)} className="error-close">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card calories-card">
          <div className="summary-icon">
            <TrendingUp />
          </div>
          <div className="summary-content">
            <h3>Total Calories</h3>
            <p className="summary-value">{totalCalories}</p>
            <span className="summary-unit">kcal</span>
          </div>
        </div>

        <div className="summary-card entries-card">
          <div className="summary-icon">
            <Clock />
          </div>
          <div className="summary-content">
            <h3>Food Items</h3>
            <p className="summary-value">{totalEntries}</p>
            <span className="summary-unit">items</span>
          </div>
        </div>

        <div className="summary-card nutrition-card">
          <div className="summary-content">
            <h3>Macros</h3>
            <div className="macro-breakdown">
              <span>P: {Math.round(nutritionTotals.protein)}g</span>
              <span>C: {Math.round(nutritionTotals.carbs)}g</span>
              <span>F: {Math.round(nutritionTotals.fat)}g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Food Button */}
      <div className="add-food-section">
        <button
          className="add-food-button"
          onClick={() => (window.location.href = "/")}
        >
          <Plus size={20} />
          Add Food
        </button>
      </div>

      {/* Food Feed */}
      {entries.length === 0 ? (
        <div className="no-entries">
          <div className="no-entries-icon">📝</div>
          <h3>No entries for this date</h3>
          <p>Start tracking your meals by scanning or adding food items!</p>
          <button
            className="cta-button"
            onClick={() => (window.location.href = "/")}
          >
            <Plus size={18} />
            Add Your First Food
          </button>
        </div>
      ) : (
        <div className="food-feed">
          {entries.map((entry) => (
            <div key={entry.id} className="food-entry">
              {isEditing === entry.id ? (
                <div className="edit-form">
                  <div className="edit-fields">
                    <div className="field-group">
                      <label>Food Name</label>
                      <input
                        type="text"
                        value={editForm.name || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            name: e.target.value,
                          })
                        }
                        className="edit-input"
                        placeholder="Food name"
                      />
                    </div>

                    <div className="field-group">
                      <label>Calories</label>
                      <input
                        type="number"
                        value={editForm.calories || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            calories: parseInt(e.target.value) || 0,
                          })
                        }
                        className="edit-input"
                        placeholder="Calories"
                      />
                    </div>

                    <div className="field-group">
                      <label>Meal Type</label>
                      <select
                        value={editForm.mealType || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            mealType: e.target.value as MealType,
                          })
                        }
                        className="edit-select"
                      >
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                        <option value="snack">Snack</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="edit-actions">
                    <button onClick={handleSaveEdit} className="save-button">
                      <Save size={16} />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="cancel-button"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="entry-header">
                    <div className="meal-badge">
                      <span className="meal-emoji">
                        {getMealEmoji(entry.mealType)}
                      </span>
                      <span className="meal-label">
                        {getMealLabel(entry.mealType)}
                      </span>
                    </div>
                    <div className="entry-time">
                      {entry.date.toDate().toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div className="entry-content">
                    <div className="entry-main">
                      <div className="entry-image">
                        {entry.imageUrl ? (
                          <img src={entry.imageUrl} alt={entry.name} />
                        ) : (
                          <div className="image-placeholder">🍽️</div>
                        )}
                      </div>

                      <div className="entry-info">
                        <h3>{entry.name}</h3>
                        <p className="entry-calories">{entry.calories} kcal</p>
                        {entry.description && (
                          <p className="entry-description">
                            {entry.description}
                          </p>
                        )}
                      </div>

                      <div className="entry-actions">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="edit-button"
                          title="Edit entry"
                        >
                          <Edit3 size={16} />
                        </button>

                        {deleteConfirm === entry.id ? (
                          <div className="delete-confirm">
                            <span>Delete?</span>
                            <button
                              onClick={() => handleDelete(entry.id!)}
                              className="confirm-delete"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="cancel-delete"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(entry.id!)}
                            className="delete-button"
                            title="Delete entry"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {entry.nutrients.length > 0 && (
                      <div className="entry-nutrients">
                        {entry.nutrients.slice(0, 4).map((nutrient, index) => (
                          <span key={index} className="nutrient-tag">
                            {nutrient.name}: {nutrient.amount}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Diary;
