import "./FoodDetails.css";

import {
  FoodItem,
  MealType,
  FoodDiaryEntry,
} from "../services/firestoreService";
import { Timestamp } from "firebase/firestore";
import {
  addFoodToDiary,
  getDiaryEntry,
  updateDiaryEntry,
} from "../services/firestoreService";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

const FoodDetails = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [foodData, setFoodData] = useState<FoodItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] =
    useState<MealType>("breakfast");
  const [isAddingToDiary, setIsAddingToDiary] = useState(false);
  const [addToDiaryError, setAddToDiaryError] = useState<string | null>(null);
  const [addToDiarySuccess, setAddToDiarySuccess] = useState(false);

  useEffect(() => {
    const fetchFoodData = async () => {
      try {
        if (id === "new") {
          // Check if we have scanned food data from navigation state
          const scannedFoodData = location.state?.scannedFoodData;
          if (scannedFoodData) {
            setFoodData(scannedFoodData);
          } else {
            setError("No food data provided");
          }
        } else if (id) {
          // Try to get from diary entry first (new structure)
          const diaryEntry = await getDiaryEntry(id);
          if (diaryEntry) {
            // Convert FoodDiaryEntry to FoodItem format for compatibility
            const foodItem: FoodItem = {
              id: diaryEntry.id,
              name: diaryEntry.name,
              calories: diaryEntry.calories,
              imageUrl: diaryEntry.imageUrl,
              ingredients: diaryEntry.ingredients,
              nutrients: diaryEntry.nutrients,
              description: diaryEntry.description,
              createdAt: diaryEntry.createdAt,
              updatedAt: diaryEntry.updatedAt,
              tempImageUrl: diaryEntry.tempImageUrl,
              imagePlaceholder: diaryEntry.imagePlaceholder,
            };
            setFoodData(foodItem);
          } else {
            setError("Food item not found");
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch food data"
        );
      }
    };

    fetchFoodData();
  }, [id, location.state]);

  const handleSave = async () => {
    if (!foodData) return;

    setIsSaving(true);
    setError(null);

    try {
      if (id === "new") {
        // Create new diary entry
        const diaryEntry: Omit<
          FoodDiaryEntry,
          "id" | "userId" | "createdAt" | "updatedAt"
        > = {
          name: foodData.name,
          calories: foodData.calories,
          imageUrl: foodData.imageUrl || "",
          ingredients: foodData.ingredients || [],
          nutrients: foodData.nutrients || [],
          description: foodData.description || "",
          mealType: selectedMealType,
          date: Timestamp.now(),
        };

        const newId = await addFoodToDiary(diaryEntry);
        setFoodData({ ...foodData, id: newId });
        console.log("✅ New food item saved with ID:", newId);
      } else {
        // Update existing diary entry
        const updateData: Partial<FoodDiaryEntry> = {
          name: foodData.name,
          calories: foodData.calories,
          imageUrl: foodData.imageUrl,
          ingredients: foodData.ingredients,
          nutrients: foodData.nutrients,
          description: foodData.description,
        };

        await updateDiaryEntry(id, updateData);
        console.log("✅ Food item updated successfully");
      }

      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save food item");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddToDiary = async () => {
    if (!foodData) return;

    setIsAddingToDiary(true);
    setAddToDiaryError(null);
    setAddToDiarySuccess(false);

    try {
      // Ensure the food item is saved first
      if (id === "new" && !foodData.id) {
        await handleSave();
      }

      // Create new diary entry with selected meal type
      const diaryEntry: Omit<
        FoodDiaryEntry,
        "id" | "userId" | "createdAt" | "updatedAt"
      > = {
        name: foodData.name,
        calories: foodData.calories,
        imageUrl: foodData.imageUrl || "",
        ingredients: foodData.ingredients || [],
        nutrients: foodData.nutrients || [],
        description: foodData.description || "",
        mealType: selectedMealType,
        date: Timestamp.now(),
      };

      await addFoodToDiary(diaryEntry);
      setAddToDiarySuccess(true);
    } catch (err) {
      setAddToDiaryError(
        err instanceof Error ? err.message : "Failed to add to diary"
      );
    } finally {
      setIsAddingToDiary(false);
    }
  };

  if (error) {
    return (
      <div className="food-details-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!foodData) {
    return (
      <div className="food-details-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="food-details-container">
      <div className="food-header">
        <div className="food-image">
          {foodData.tempImageUrl ? (
            <img src={foodData.tempImageUrl} alt={foodData.name} />
          ) : (
            <div className="image-placeholder">
              {foodData.imagePlaceholder || "🍽️"}
            </div>
          )}
        </div>
        <div className="food-info">
          {isEditing ? (
            <input
              type="text"
              value={foodData.name}
              onChange={(e) =>
                setFoodData({ ...foodData, name: e.target.value })
              }
              className="food-name-input"
            />
          ) : (
            <h1>{foodData.name}</h1>
          )}
          <div className="calories">
            {isEditing ? (
              <input
                type="number"
                value={foodData.calories}
                onChange={(e) =>
                  setFoodData({
                    ...foodData,
                    calories: parseInt(e.target.value) || 0,
                  })
                }
                className="calories-input"
              />
            ) : (
              <span>{foodData.calories} calories</span>
            )}
          </div>
        </div>
      </div>

      <div className="food-details">
        {foodData.ingredients && foodData.ingredients.length > 0 && (
          <div className="ingredients-section">
            <h2>Ingredients</h2>
            <div className="table-header">
              <div>Name</div>
              <div>Weight/Volume</div>
              <div>Calories</div>
            </div>
            <ul className="ingredients-list">
              {foodData.ingredients.map((ingredient, index) => (
                <li key={index} className="ingredient-item">
                  <span className="name">{ingredient.name}</span>
                  <span className="amount">{ingredient.weight}</span>
                  <span className="calories">{ingredient.calories} cal</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {foodData.nutrients && foodData.nutrients.length > 0 && (
          <div className="nutrients-section">
            <h2>Nutrition Facts</h2>
            <div className="table-header">
              <div>Nutrient</div>
              <div>Amount</div>
              <div>RDA</div>
            </div>
            <ul className="nutrients-list">
              {foodData.nutrients.map((nutrient, index) => (
                <li key={index} className="nutrient-item">
                  <span className="name">{nutrient.name}</span>
                  <span className="amount">{nutrient.amount}</span>
                  <span className="rda">{nutrient.rda || "N/A"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {foodData.description && (
          <div className="description-section">
            <h2>Description</h2>
            <p>{foodData.description}</p>
          </div>
        )}
      </div>

      <div className="action-buttons">
        {isEditing ? (
          <button
            className="save-button"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        ) : (
          <button className="edit-button" onClick={() => setIsEditing(true)}>
            Edit Food Item
          </button>
        )}
      </div>

      <div className="add-to-diary-section">
        <h2>Add to Food Diary</h2>
        <div className="add-to-diary-form">
          <select
            value={selectedMealType}
            onChange={(e) => setSelectedMealType(e.target.value as MealType)}
            className="meal-type-select"
          >
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
          <button
            className="add-to-diary-button"
            onClick={handleAddToDiary}
            disabled={isAddingToDiary}
          >
            {isAddingToDiary ? "Adding..." : "Add to Diary"}
          </button>
        </div>
        {addToDiaryError && (
          <div className="error-message">{addToDiaryError}</div>
        )}
        {addToDiarySuccess && (
          <div className="success-message">
            Successfully added to food diary!
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodDetails;
