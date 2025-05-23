import React, { useState } from "react";
import { addTestData } from "../utils/testData";
import "./DebugPanel.css";

const DebugPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleAddTestData = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      await addTestData();
      setMessage(
        "✅ Test data added successfully! Refresh the page to see the changes."
      );
    } catch (error) {
      setMessage(
        `❌ Failed to add test data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="debug-panel">
      <h3>🔧 Debug Panel</h3>
      <div className="debug-actions">
        <button
          onClick={handleAddTestData}
          disabled={isLoading}
          className="debug-button"
        >
          {isLoading ? "Adding..." : "Add Test Data"}
        </button>
        <button onClick={handleRefresh} className="debug-button secondary">
          Refresh Page
        </button>
      </div>
      {message && (
        <div
          className={`debug-message ${
            message.includes("✅") ? "success" : "error"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
