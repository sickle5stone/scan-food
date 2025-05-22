import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

interface NutrientData {
  current: number;
  target: number;
  unit: string;
}

const Home = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mock data - in a real app, this would come from an API or state management
  const nutritionData = useState({
    caloriesEaten: 1258,
    caloriesTarget: 2543,
    caloriesRemaining: 1285,
    caloriesBurned: 218,
    caloriesBurnedTarget: 1257,
    calorieDeficit: 1246,
    nutrients: {
      carbs: { current: 156, target: 260, unit: "g" },
      protein: { current: 102, target: 223, unit: "g" },
      fat: { current: 35, target: 96, unit: "g" },
    },
    recentMeals: [
      {
        id: "1",
        name: "Blackcurrant Puree",
        calories: 70,
        image: "blackcurrant.jpg",
      },
      {
        id: "2",
        name: "Crispy Roast Pork with Rice",
        calories: 430,
        image: "roast-pork.jpg",
      },
    ],
  })[0]; // Only use the state value, not the setter

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

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const renderNutrientBar = (name: string, data: NutrientData) => {
    const percentage = Math.min(100, (data.current / data.target) * 100);
    let barClass = "nutrient-bar";

    if (name === "Carbs") barClass += " carbs";
    if (name === "Protein") barClass += " protein";
    if (name === "Fat") barClass += " fat";

    return (
      <div className="nutrient-item">
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
      </div>
    );
  };

  return (
    <div className="home-page">
      {/* Date selector */}
      <div className="date-section">
        <h2>Today</h2>
        <div className="date-selector">
          {weekDates.map((date, index) => (
            <div
              key={index}
              className={`date-item ${isToday(date) ? "current" : ""} ${
                date === selectedDate ? "selected" : ""
              }`}
              onClick={() => setSelectedDate(date)}
            >
              <span className="date-number">{formatDate(date)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calorie Summary Card */}
      <div className="card calorie-card">
        <div className="calorie-header">
          <div className="calorie-title">Calorie Deficit</div>
          <div className="calorie-value">
            {nutritionData.calorieDeficit} kcal
          </div>
        </div>

        <div className="calorie-mascot">
          {/* This would be an actual image in the real app */}
          <div className="mascot-placeholder">🥦</div>
        </div>

        <div className="calorie-stats">
          <div className="calorie-stat">
            <div className="stat-value">{nutritionData.caloriesEaten}</div>
            <div className="stat-label">
              / {nutritionData.caloriesTarget}kcal
            </div>
            <div className="stat-description">Eaten</div>
          </div>

          <div className="calorie-stat main-stat">
            <div className="stat-value">{nutritionData.caloriesRemaining}</div>
            <div className="stat-label">Remaining</div>
          </div>

          <div className="calorie-stat">
            <div className="stat-value">{nutritionData.caloriesBurned}</div>
            <div className="stat-label">
              / {nutritionData.caloriesBurnedTarget}kcal
            </div>
            <div className="stat-description">Burned</div>
          </div>
        </div>
      </div>

      {/* Nutrients Card */}
      <div className="card nutrients-card">
        <h3>Nutrients</h3>
        <div className="nutrients-container">
          {renderNutrientBar("Carbs", nutritionData.nutrients.carbs)}
          {renderNutrientBar("Protein", nutritionData.nutrients.protein)}
          {renderNutrientBar("Fat", nutritionData.nutrients.fat)}
        </div>
      </div>

      {/* Recent Meals */}
      <div className="recent-meals">
        <div className="section-header">
          <h3>Recent Meals</h3>
          <button className="scan-button" onClick={() => navigate("/scan")}>
            Scan New Food
          </button>
        </div>

        <div className="meals-list">
          {nutritionData.recentMeals.map((meal) => (
            <div
              key={meal.id}
              className="meal-item"
              onClick={() => navigate(`/food/${meal.id}`)}
            >
              <div className="meal-image placeholder-image">
                {/* This would be an actual image in the real app */}
                {meal.name.includes("Pork") ? "🍖" : "🫐"}
              </div>
              <div className="meal-details">
                <div className="meal-name">{meal.name}</div>
                <div className="meal-calories">{meal.calories} kcal</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
