import "../utils/testData"; // Import test data utility
import "./Home.css";

import { useEffect, useState } from "react";

import DebugPanel from "../components/DebugPanel";
import { FoodDiaryEntry } from "../types/food";
import { getDiaryEntries } from "../services/firestoreService";
import { useNavigate } from "react-router-dom";

interface NutrientData {
  current: number;
  target: number;
  unit: string;
}

interface DailyStats {
  caloriesEaten: number;
  caloriesTarget: number;
  caloriesRemaining: number;
  caloriesBurned: number;
  caloriesBurnedTarget: number;
  calorieDeficit: number;
  nutrients: {
    carbs: NutrientData;
    protein: NutrientData;
    fat: NutrientData;
  };
  recentMeals: Array<{
    id: string;
    name: string;
    calories: number;
    mealType: string;
    timestamp: Date;
  }>;
}

const Home = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    caloriesEaten: 0,
    caloriesTarget: 2000,
    caloriesRemaining: 2000,
    caloriesBurned: 0,
    caloriesBurnedTarget: 500,
    calorieDeficit: 0,
    nutrients: {
      carbs: { current: 0, target: 250, unit: "g" },
      protein: { current: 0, target: 150, unit: "g" },
      fat: { current: 0, target: 65, unit: "g" },
    },
    recentMeals: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch diary data for selected date
  useEffect(() => {
    const fetchDailyData = async () => {
      setLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual user ID from authentication
        const userId = "current-user-id";
        const diaryEntries = await getDiaryEntries(userId, selectedDate);

        // Convert diary entries to meals format
        const meals = diaryEntries.map((entry: FoodDiaryEntry) => ({
          id: entry.id!,
          name: entry.name,
          calories: entry.calories,
          mealType: entry.mealType,
          timestamp: entry.date.toDate(),
          foodItem: entry, // Include full entry for nutrient calculations
        }));

        // Calculate daily statistics
        const totalCalories = meals.reduce(
          (sum, meal) => sum + meal.calories,
          0
        );

        const totalCarbs = meals.reduce((sum, meal) => {
          const carbsNutrient = meal.foodItem.nutrients.find((n) =>
            n.name.toLowerCase().includes("carb")
          );
          return (
            sum + (carbsNutrient ? parseFloat(carbsNutrient.amount) || 0 : 0)
          );
        }, 0);

        const totalProtein = meals.reduce((sum, meal) => {
          const proteinNutrient = meal.foodItem.nutrients.find((n) =>
            n.name.toLowerCase().includes("protein")
          );
          return (
            sum +
            (proteinNutrient ? parseFloat(proteinNutrient.amount) || 0 : 0)
          );
        }, 0);

        const totalFat = meals.reduce((sum, meal) => {
          const fatNutrient = meal.foodItem.nutrients.find((n) =>
            n.name.toLowerCase().includes("fat")
          );
          return sum + (fatNutrient ? parseFloat(fatNutrient.amount) || 0 : 0);
        }, 0);

        const caloriesTarget = 2000;
        const caloriesRemaining = Math.max(0, caloriesTarget - totalCalories);
        const caloriesBurned = 0; // TODO: Integrate with fitness tracking
        const calorieDeficit = caloriesTarget - totalCalories + caloriesBurned;

        setDailyStats({
          caloriesEaten: totalCalories,
          caloriesTarget,
          caloriesRemaining,
          caloriesBurned,
          caloriesBurnedTarget: 500,
          calorieDeficit,
          nutrients: {
            carbs: { current: Math.round(totalCarbs), target: 250, unit: "g" },
            protein: {
              current: Math.round(totalProtein),
              target: 150,
              unit: "g",
            },
            fat: { current: Math.round(totalFat), target: 65, unit: "g" },
          },
          recentMeals: meals.slice(-5), // Show last 5 meals
        });
      } catch (err) {
        console.error("Error fetching daily data:", err);
        setError("Failed to load daily data");
      } finally {
        setLoading(false);
      }
    };

    fetchDailyData();
  }, [selectedDate]);

  // Generate week dates for date selector
  const getWeekDates = () => {
    const today = new Date();
    const dates = [];

    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  const weekDates = getWeekDates();

  const formatDate = (date: Date) => {
    return date.getDate().toString();
  };

  const formatDateLabel = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (isSameDay(date, today)) return "Today";
    if (isSameDay(date, yesterday)) return "Yesterday";
    if (isSameDay(date, tomorrow)) return "Tomorrow";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  const renderNutrientBar = (name: string, data: NutrientData) => {
    const percentage = Math.min(100, (data.current / data.target) * 100);
    let barClass = "nutrient-bar";

    if (name === "Carbs") barClass += " carbs";
    if (name === "Protein") barClass += " protein";
    if (name === "Fat") barClass += " fat";

    return (
      <div className="nutrient-item" key={name}>
        <div className="nutrient-header">
          <span className="nutrient-name">{name}</span>
          <span className="nutrient-values">
            {data.current} / {data.target}
            {data.unit}
          </span>
        </div>
        <div className="bar-container">
          <div className={barClass} style={{ width: `${percentage}%` }}></div>
        </div>
        <div className="nutrient-percentage">{Math.round(percentage)}%</div>
      </div>
    );
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case "breakfast":
        return "🌅";
      case "lunch":
        return "☀️";
      case "dinner":
        return "🌙";
      case "snack":
        return "🍎";
      default:
        return "🍽️";
    }
  };

  if (loading) {
    return (
      <div className="home-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your daily nutrition...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Header with greeting */}
      <div className="header-section">
        <div className="greeting">
          <h1>
            Good{" "}
            {new Date().getHours() < 12
              ? "Morning"
              : new Date().getHours() < 18
              ? "Afternoon"
              : "Evening"}
            ! 👋
          </h1>
          <p>Let's track your nutrition for {formatDateLabel(selectedDate)}</p>
        </div>
      </div>

      {/* Date selector */}
      <div className="date-section">
        <div className="date-selector">
          {weekDates.map((date, index) => (
            <div
              key={index}
              className={`date-item ${isToday(date) ? "current" : ""} ${
                isSameDay(date, selectedDate) ? "selected" : ""
              }`}
              onClick={() => setSelectedDate(date)}
            >
              <span className="date-number">{formatDate(date)}</span>
              <span className="date-day">
                {date.toLocaleDateString("en-US", { weekday: "short" })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {/* Calorie Summary Card */}
      <div className="card calorie-card">
        <div className="calorie-header">
          <div className="calorie-title">Daily Progress</div>
          <div className="calorie-value">
            {dailyStats.caloriesEaten} / {dailyStats.caloriesTarget} kcal
          </div>
        </div>

        <div className="calorie-progress">
          <div className="progress-ring">
            <svg className="progress-ring-svg" width="120" height="120">
              <circle
                className="progress-ring-circle-bg"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="transparent"
                r="52"
                cx="60"
                cy="60"
              />
              <circle
                className="progress-ring-circle"
                stroke="#10b981"
                strokeWidth="8"
                fill="transparent"
                r="52"
                cx="60"
                cy="60"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${
                  2 *
                  Math.PI *
                  52 *
                  (1 -
                    Math.min(
                      1,
                      dailyStats.caloriesEaten / dailyStats.caloriesTarget
                    ))
                }`}
              />
            </svg>
            <div className="progress-text">
              <span className="progress-percentage">
                {Math.round(
                  (dailyStats.caloriesEaten / dailyStats.caloriesTarget) * 100
                )}
                %
              </span>
              <span className="progress-label">Complete</span>
            </div>
          </div>
        </div>

        <div className="calorie-stats">
          <div className="calorie-stat">
            <div className="stat-value">{dailyStats.caloriesEaten}</div>
            <div className="stat-label">Eaten</div>
          </div>

          <div className="calorie-stat main-stat">
            <div className="stat-value">{dailyStats.caloriesRemaining}</div>
            <div className="stat-label">Remaining</div>
          </div>

          <div className="calorie-stat">
            <div className="stat-value">{dailyStats.caloriesBurned}</div>
            <div className="stat-label">Burned</div>
          </div>
        </div>
      </div>

      {/* Nutrients Card */}
      <div className="card nutrients-card">
        <h3>Macronutrients</h3>
        <div className="nutrients-container">
          {renderNutrientBar("Carbs", dailyStats.nutrients.carbs)}
          {renderNutrientBar("Protein", dailyStats.nutrients.protein)}
          {renderNutrientBar("Fat", dailyStats.nutrients.fat)}
        </div>
      </div>

      {/* Recent Meals */}
      <div className="recent-meals">
        <div className="section-header">
          <h3>Today's Meals ({dailyStats.recentMeals.length})</h3>
          <div className="header-actions">
            <button
              className="view-all-button"
              onClick={() => navigate("/diary")}
            >
              View All
            </button>
            <button className="scan-button" onClick={() => navigate("/scan")}>
              <span className="scan-icon">📸</span>
              Scan Food
            </button>
          </div>
        </div>

        {dailyStats.recentMeals.length === 0 ? (
          <div className="empty-meals">
            <div className="empty-icon">🍽️</div>
            <p>No meals logged for {formatDateLabel(selectedDate)}</p>
            <button
              className="scan-button primary"
              onClick={() => navigate("/scan")}
            >
              Add Your First Meal
            </button>
          </div>
        ) : (
          <div className="meals-list">
            {dailyStats.recentMeals.map((meal) => (
              <div
                key={meal.id}
                className="meal-item"
                onClick={() => navigate(`/food/${meal.id}`)}
              >
                <div className="meal-image">{getMealIcon(meal.mealType)}</div>
                <div className="meal-details">
                  <div className="meal-name">{meal.name}</div>
                  <div className="meal-meta">
                    <span className="meal-calories">{meal.calories} kcal</span>
                    <span className="meal-type">{meal.mealType}</span>
                    <span className="meal-time">
                      {meal.timestamp.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                </div>
                <div className="meal-arrow">→</div>
              </div>
            ))}

            {dailyStats.recentMeals.length > 0 && (
              <div className="view-more-meals">
                <button
                  className="view-more-button"
                  onClick={() => navigate("/diary")}
                >
                  View Full Diary →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="action-button" onClick={() => navigate("/scan")}>
          <span className="action-icon">📸</span>
          <span>Scan Food</span>
        </button>
        <button className="action-button" onClick={() => navigate("/diary")}>
          <span className="action-icon">📊</span>
          <span>View Diary</span>
        </button>
        <button className="action-button" onClick={() => navigate("/food/new")}>
          <span className="action-icon">➕</span>
          <span>Add Manual</span>
        </button>
      </div>

      {/* Debug Panel for testing */}
      <DebugPanel />
    </div>
  );
};

export default Home;
