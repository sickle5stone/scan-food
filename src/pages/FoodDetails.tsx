import "./FoodDetails.css";

import {
  FoodItem,
  addDiaryEntry,
  getFoodItem,
} from "../services/firestoreService";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Timestamp } from "firebase/firestore";
import { getImageUrl } from "../services/storageService";

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

// --- Mock API Data Store ---
// This can be removed once the backend is fully implemented
// --- End Mock API Data Store ---

// Updated to use the backend API to fetch nutritional information
const fetchNutritionalInfoAPI = async (
  foodId: string
): Promise<FoodItem | null> => {
  console.log(
    `Fetching nutritional info from backend API for food ID: ${foodId}`
  );

  try {
    const response = await fetch(`http://localhost:3005/api/food/${foodId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || "Failed to fetch nutritional information"
      );
    }

    const data = await response.json();
    return data as FoodItem;
  } catch (error) {
    console.error("Error fetching nutritional info:", error);
    throw error;
  }
};

const FoodDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [foodData, setFoodData] = useState<FoodItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingToDiary, setIsAddingToDiary] = useState(false);
  const [diaryError, setDiaryError] = useState<string | null>(null);
  const [mealType, setMealType] = useState("breakfast");

  useEffect(() => {
    const fetchFoodData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);
        const data = await getFoodItem(id);
        if (data) {
          // Get the actual image URL from Firebase Storage
          const imageUrl = await getImageUrl(data.imageUrl);
          setFoodData({ ...data, imageUrl });
        } else {
          setError("Food item not found");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error loading food details"
        );
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFoodData();
  }, [id]);

  const handleAddToDiary = async () => {
    if (!foodData) return;

    try {
      setIsAddingToDiary(true);
      setDiaryError(null);

      // TODO: Get actual user ID from authentication
      const userId = "current-user-id";

      await addDiaryEntry({
        userId,
        foodItemId: foodData.id!,
        mealType: mealType as
          | "breakfast"
          | "lunch"
          | "dinner"
          | "snack"
          | "other",
        date: Timestamp.now(),
      });

      // Navigate to diary page after successful addition
      navigate("/diary");
    } catch (err) {
      setDiaryError("Failed to add to diary. Please try again.");
      console.error(err);
    } finally {
      setIsAddingToDiary(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="analyzing-spinner"></div>
        <p>Loading food details...</p>
      </div>
    );
  }

  if (error || !foodData) {
    return (
      <div className="error-container">
        <p>{error || "Food item not found"}</p>
        <div className="error-actions">
          <button
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
          <button className="back-button" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="food-details-container">
      <div className="food-image-container">
        {foodData.imageUrl ? (
          <img
            src={foodData.imageUrl}
            alt={foodData.name}
            className="food-image"
          />
        ) : (
          <div className="food-image-placeholder">🍽️</div>
        )}
      </div>

      <div className="food-header">
        <h1>{foodData.name}</h1>
      </div>

      <div className="food-summary">
        <div className="calories">
          <h2>{foodData.calories}</h2>
          <p>calories</p>
        </div>
      </div>

      <div className="food-actions">
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          className="meal-type-select"
        >
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
          <option value="other">Other</option>
        </select>
        <button
          onClick={handleAddToDiary}
          disabled={isAddingToDiary}
          className="add-button"
        >
          {isAddingToDiary ? "Adding..." : "Add to Diary"}
        </button>
      </div>

      {diaryError && (
        <div className="error-message">
          <p>{diaryError}</p>
        </div>
      )}

      <div className="food-details">
        <section className="ingredients">
          <h2>Ingredients</h2>
          <div className="table-header">
            <div>Name</div>
            <div>Weight/Volume</div>
            <div>Calories</div>
          </div>
          <ul>
            {foodData.ingredients.map((ingredient, index) => (
              <li key={index}>
                <span className="name">{ingredient.name}</span>
                <span className="amount">{ingredient.weight}</span>
                <span className="calories">{ingredient.calories} cal</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="nutrients">
          <h2>Nutrition Facts</h2>
          <div className="table-header">
            <div>Nutrient</div>
            <div>Amount</div>
            <div>RDA</div>
          </div>
          <ul>
            {foodData.nutrients.map((nutrient, index) => (
              <li key={index}>
                <span className="name">{nutrient.name}</span>
                <span className="amount">{nutrient.amount}</span>
                <span className="calories">{nutrient.rda || "-"}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default FoodDetails;
