import "./ScanFood.css";

import { useCallback, useEffect, useRef, useState } from "react";

import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";

// Placeholder type for what your image recognition API might return
interface RecognizedFood {
  id: string;
  name: string;
  confidence?: number;
  possibleAlternatives?: string[];
  calories?: number;
  ingredients?: string[];
  nutrients?: {
    carbs: number;
    protein: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  rdaPercentages?: {
    carbs: number;
    protein: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  description?: string;
  imageUrl?: string;
}

// Updated to use the backend API for food recognition with improved error handling
const recognizeFoodFromImageAPI = async (
  imageDataUrl: string
): Promise<RecognizedFood> => {
  console.log("Sending image to backend API for food recognition...");

  try {
    // First check if the backend server is available
    try {
      const serverCheckResponse = await fetch(
        "http://localhost:3005/api/health",
        {
          method: "GET",
          mode: "cors",
          cache: "no-cache",
          headers: {
            Accept: "application/json",
          },
          // Shorter timeout for the health check
          signal: AbortSignal.timeout(3000),
        }
      );

      if (!serverCheckResponse.ok) {
        throw new Error("Backend server is not responding correctly");
      }
    } catch (serverCheckError) {
      console.error("Backend server check failed:", serverCheckError);
      throw new Error(
        "Cannot connect to the backend server. Please make sure it's running at http://localhost:3005"
      );
    }

    // Convert the data URL to a file or blob for the multipart/form-data request
    const blob = await fetch(imageDataUrl).then((res) => res.blob());
    const formData = new FormData();
    formData.append("image", blob, "food-image.jpg");

    // Call the backend API with timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch("http://localhost:3005/api/food/recognize", {
        method: "POST",
        body: formData,
        signal: controller.signal,
        // No content-type header needed as browser sets it with boundary for form-data
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: {
            message: "Error communicating with the recognition service",
          },
        }));
        throw new Error(
          errorData.error?.message ||
            "Error communicating with the recognition service"
        );
      }

      const data = await response.json();

      // Validate response data
      if (!data || !data.id || !data.name) {
        throw new Error("Invalid response from recognition service");
      }

      return {
        id: data.id,
        name: data.name,
        confidence: data.confidence,
        possibleAlternatives: data.possibleAlternatives,
        calories: data.calories,
        ingredients: data.ingredients,
        nutrients: data.nutrients,
        rdaPercentages: data.rdaPercentages,
        description: data.description,
        imageUrl: data.imageUrl,
      };
    } catch (fetchError) {
      // Handle network errors specifically
      if (
        fetchError instanceof TypeError &&
        fetchError.message.includes("Failed to fetch")
      ) {
        throw new Error(
          "Network error: Could not connect to the backend server. Make sure it's running and accessible."
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("API call failed:", error);

    // For timeout errors
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "Request timeout. Please try again with a smaller image."
      );
    }

    // For any other errors, pass the error message through
    throw error;
  }
};

const funTips = [
  "Did you know? The average person makes over 200 food decisions every day! 🧠",
  "Pro tip: Take photos in good lighting for better food recognition! 💡",
  "Fun fact: Your taste buds regenerate every 10-14 days! 👅",
  "Remember: A balanced meal includes protein, carbs, and healthy fats! 🥗",
  "Did you know? The first food photographed was a pear in 1825! 📸",
];

const loadingMessages = [
  "Analyzing your delicious meal... 🍽️",
  "Calculating nutritional values... 📊",
  "Identifying ingredients... 🔍",
  "Almost there... ⏳",
  "Preparing your food insights... 🎯",
];

const ScanFood = () => {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<
    "user" | "environment"
  >("environment");
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Effect to clean up when component unmounts
  useEffect(() => {
    return () => {
      if (webcamRef.current && webcamRef.current.stream) {
        const stream = webcamRef.current.stream;
        const tracks = stream.getTracks();

        tracks.forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  // Add effect for rotating tips and messages
  useEffect(() => {
    if (isAnalyzing) {
      const tipInterval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % funTips.length);
      }, 5000);

      const messageInterval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);

      return () => {
        clearInterval(tipInterval);
        clearInterval(messageInterval);
      };
    }
  }, [isAnalyzing]);

  const handleImageAvailable = (imageDataUrl: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    // Stop the camera when analysis starts
    if (webcamRef.current && webcamRef.current.stream) {
      const stream = webcamRef.current.stream;
      const tracks = stream.getTracks();
      tracks.forEach((track) => {
        track.stop();
      });
    }

    recognizeFoodFromImageAPI(imageDataUrl)
      .then((recognizedFood) => {
        console.log("Food recognized:", recognizedFood);
        navigate(`/food/new`, {
          state: {
            scannedFoodData: {
              id:
                recognizedFood.id ||
                `food_${Date.now()}_${recognizedFood.name
                  ?.toLowerCase()
                  .replace(/\s+/g, "_")}`,
              name: recognizedFood.name || "Scanned Item",
              imagePlaceholder: "📷",
              calories: recognizedFood.calories || 0,
              ingredients:
                recognizedFood.ingredients?.map((ingredient) => ({
                  name: ingredient,
                  weight: "100g",
                  calories: Math.round(
                    (recognizedFood.calories || 0) /
                      (recognizedFood.ingredients?.length || 1)
                  ),
                })) || [],
              nutrients: [
                {
                  name: "Carbs",
                  amount: `${recognizedFood.nutrients?.carbs || 0}g`,
                  rda: `${recognizedFood.rdaPercentages?.carbs || 0}%`,
                },
                {
                  name: "Protein",
                  amount: `${recognizedFood.nutrients?.protein || 0}g`,
                  rda: `${recognizedFood.rdaPercentages?.protein || 0}%`,
                },
                {
                  name: "Fat",
                  amount: `${recognizedFood.nutrients?.fat || 0}g`,
                  rda: `${recognizedFood.rdaPercentages?.fat || 0}%`,
                },
                {
                  name: "Fiber",
                  amount: `${recognizedFood.nutrients?.fiber || 0}g`,
                  rda: `${recognizedFood.rdaPercentages?.fiber || 0}%`,
                },
                {
                  name: "Sugar",
                  amount: `${recognizedFood.nutrients?.sugar || 0}g`,
                  rda: `${recognizedFood.rdaPercentages?.sugar || 0}%`,
                },
              ],
              description: recognizedFood.description || "",
              tempImageUrl: imageDataUrl, // Store image temporarily in memory
            },
          },
        });
      })
      .catch((err) => {
        console.error("Error recognizing food:", err);
        let errorMessage = "Failed to analyze image. Please try again.";

        if (err instanceof Error) {
          errorMessage = err.message;
        }

        setAnalysisError(errorMessage);
        setIsAnalyzing(false);
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === "string") {
          handleImageAvailable(event.target.result);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCameraCapture = useCallback(() => {
    if (webcamRef.current) {
      try {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          handleImageAvailable(imageSrc);
        } else {
          setCameraError("Failed to capture image. Please try again.");
        }
      } catch (error) {
        console.error("Error capturing image:", error);
        setCameraError("Failed to capture image. Please try again.");
      }
    }
  }, []);

  const switchCamera = () => {
    setCameraFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  return (
    <div className="scan-food-container">
      <div className="camera-container">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: cameraFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }}
          className="camera-view"
          onUserMediaError={(error) => {
            console.error("Camera error:", error);
            setCameraError(
              "Failed to access camera. Please check permissions."
            );
          }}
        />
      </div>

      <div className="camera-controls">
        <button
          className="capture-button"
          onClick={handleCameraCapture}
          disabled={isAnalyzing}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
            <path
              fillRule="evenodd"
              d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z"
              clipRule="evenodd"
            />
          </svg>
          Capture Photo
        </button>

        <div className="camera-options">
          <button
            className="switch-camera-button"
            onClick={switchCamera}
            disabled={isAnalyzing}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path
                fillRule="evenodd"
                d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z"
                clipRule="evenodd"
              />
            </svg>
            Switch Camera
          </button>

          <div className="upload-button-container">
            <button
              className="upload-button"
              onClick={() => document.getElementById("file-input")?.click()}
              disabled={isAnalyzing}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
                  clipRule="evenodd"
                />
              </svg>
              Upload Photo
            </button>
          </div>
        </div>
      </div>

      <input
        id="file-input"
        type="file"
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />

      {isAnalyzing && (
        <div className="analyzing-container">
          <div className="analyzing-spinner"></div>
          <p>{loadingMessages[currentMessageIndex]}</p>
          <div className="analyzing-tips">
            <p>{funTips[currentTipIndex]}</p>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="error-container">
          <p>{cameraError}</p>
          <button onClick={() => setCameraError(null)} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {analysisError && (
        <div className="error-container">
          <p>{analysisError}</p>
          <button
            onClick={() => setAnalysisError(null)}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default ScanFood;
