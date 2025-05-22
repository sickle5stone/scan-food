import "./Diary.css";

import { useEffect, useState } from "react";

interface DiaryEntry {
  id: string;
  foodId: string;
  name: string;
  calories: number;
  nutrients: {
    carbs: number;
    protein: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  mealType: string;
  timestamp: string;
}

interface MealGroup {
  type: string;
  entries: DiaryEntry[];
  totalCalories: number;
}

const Diary = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DiaryEntry>>({});

  // Format date for input
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  // Fetch diary entries
  const fetchEntries = async (date: Date) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:3005/api/diary/entries?date=${formatDateForInput(
          date
        )}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch diary entries");
      }
      const data = await response.json();
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch entries");
    } finally {
      setLoading(false);
    }
  };

  // Group entries by meal type
  const groupEntriesByMeal = (entries: DiaryEntry[]): MealGroup[] => {
    const groups: { [key: string]: MealGroup } = {
      breakfast: { type: "Breakfast", entries: [], totalCalories: 0 },
      lunch: { type: "Lunch", entries: [], totalCalories: 0 },
      dinner: { type: "Dinner", entries: [], totalCalories: 0 },
      snack: { type: "Snacks", entries: [], totalCalories: 0 },
      other: { type: "Other", entries: [], totalCalories: 0 },
    };

    entries.forEach((entry) => {
      const group = groups[entry.mealType] || groups.other;
      group.entries.push(entry);
      group.totalCalories += entry.calories;
    });

    return Object.values(groups).filter((group) => group.entries.length > 0);
  };

  // Delete entry
  const handleDelete = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      const response = await fetch(
        `http://localhost:3005/api/diary/entries/${entryId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete entry");
      await fetchEntries(selectedDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    }
  };

  // Start editing
  const handleEdit = (entry: DiaryEntry) => {
    setIsEditing(entry.id);
    setEditForm({
      mealType: entry.mealType,
      timestamp: entry.timestamp,
    });
  };

  // Save edit
  const handleSaveEdit = async (entryId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3005/api/diary/entries/${entryId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        }
      );
      if (!response.ok) throw new Error("Failed to update entry");
      setIsEditing(null);
      await fetchEntries(selectedDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update entry");
    }
  };

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
    fetchEntries(newDate);
  };

  useEffect(() => {
    fetchEntries(selectedDate);
  }, [selectedDate]);

  const mealGroups = groupEntriesByMeal(entries);
  const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);

  if (loading) {
    return (
      <div className="diary-loading">
        <div className="loading-spinner"></div>
        <p>Loading diary entries...</p>
      </div>
    );
  }

  return (
    <div className="diary-container">
      <div className="diary-header">
        <h1>Food Diary</h1>
        <div className="date-selector">
          <input
            type="date"
            value={formatDateForInput(selectedDate)}
            onChange={handleDateChange}
            className="date-input"
          />
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <div className="diary-summary">
        <div className="total-calories">
          <h3>Total Calories</h3>
          <p>{totalCalories} kcal</p>
        </div>
      </div>

      {mealGroups.length === 0 ? (
        <div className="no-entries">
          <p>No entries for this date</p>
        </div>
      ) : (
        <div className="meal-groups">
          {mealGroups.map((group) => (
            <div key={group.type} className="meal-group">
              <div className="meal-header">
                <h2>{group.type}</h2>
                <span className="meal-calories">
                  {group.totalCalories} kcal
                </span>
              </div>
              <div className="meal-entries">
                {group.entries.map((entry) => (
                  <div key={entry.id} className="diary-entry">
                    {isEditing === entry.id ? (
                      <div className="edit-form">
                        <select
                          value={editForm.mealType}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              mealType: e.target.value,
                            })
                          }
                          className="meal-type-select"
                        >
                          <option value="breakfast">Breakfast</option>
                          <option value="lunch">Lunch</option>
                          <option value="dinner">Dinner</option>
                          <option value="snack">Snack</option>
                          <option value="other">Other</option>
                        </select>
                        <div className="edit-actions">
                          <button
                            onClick={() => handleSaveEdit(entry.id)}
                            className="save-button"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setIsEditing(null)}
                            className="cancel-button"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="entry-info">
                          <h3>{entry.name}</h3>
                          <p>{entry.calories} kcal</p>
                        </div>
                        <div className="entry-actions">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="edit-button"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="delete-button"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Diary;
