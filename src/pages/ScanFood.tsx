import "./ScanFood.css";

import { useCallback, useEffect, useRef, useState } from "react";

import { Link } from "react-router-dom";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";

// Placeholder type for what your image recognition API might return
interface RecognizedFood {
  id: string;
  name: string;
  confidence?: number;
  possibleAlternatives?: string[];
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

const ScanFood = () => {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<
    "user" | "environment"
  >("environment");

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

  const handleImageAvailable = (imageDataUrl: string) => {
    setScannedImage(imageDataUrl);
    setIsAnalyzing(true);
    setAnalysisError(null);

    recognizeFoodFromImageAPI(imageDataUrl)
      .then((recognizedFood) => {
        console.log("Food recognized:", recognizedFood);
        // Navigate to FoodDetails page with the recognized food ID
        // We can also pass some initial data via route state if needed
        navigate(`/food/${recognizedFood.id || "new"}`, {
          state: {
            scannedFoodData: {
              id: recognizedFood.id || Date.now().toString(), // temp id if API doesn't give one
              name: recognizedFood.name || "Scanned Item",
              imagePlaceholder: "📷", // Generic placeholder for a scanned image
              calories: 0, // Will be fetched by FoodDetails
              ingredients: [],
              nutrients: [],
            },
          },
        });
      })
      .catch((err) => {
        console.error("Error recognizing food:", err);
        setAnalysisError(
          err.message || "Failed to analyze image. Please try again."
        );
        setIsAnalyzing(false); // Allow user to try again or upload
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
      } catch (err) {
        console.error("Error taking photo:", err);
        setCameraError("Error capturing photo. Please try again.");
      }
    }
  }, [webcamRef]);

  const handleCameraError = useCallback((error: string | DOMException) => {
    console.error("Camera error:", error);
    let message = "Unable to access camera. Please check permissions.";
    if (typeof error === "string" && error.includes("Permission denied")) {
      message =
        "Camera permission denied. Please enable it in your browser settings.";
    } else if (error instanceof DOMException) {
      if (error.name === "NotAllowedError") {
        message =
          "Camera permission denied. Please enable it in your browser settings.";
      } else if (error.name === "NotFoundError") {
        message =
          "No camera found. Please connect a camera or use gallery upload.";
      } else if (error.name === "NotReadableError") {
        message =
          "Camera is busy or not readable. Please try again or check if another app is using it.";
      }
    }
    setCameraError(message);
    setIsAnalyzing(false);
  }, []);

  const handleUserMedia = useCallback(() => {
    console.log("Camera connected successfully");
  }, []);

  const switchCamera = () => {
    // Stop current stream before switching
    if (webcamRef.current && webcamRef.current.stream) {
      const stream = webcamRef.current.stream;
      const tracks = stream.getTracks();

      tracks.forEach((track) => {
        track.stop();
      });
    }

    setCameraFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  return (
    <div className="scan-food-container">
      {!isAnalyzing && (
        <div className="camera-container">
          {cameraError ? (
            <div className="camera-error">
              <p>{cameraError}</p>
              <div className="error-actions">
                <button onClick={handleCameraCapture} className="retry-button">
                  Try Again
                </button>
                <Link to="/" className="back-button">
                  Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: cameraFacingMode,
                }}
                onUserMedia={handleUserMedia}
                onUserMediaError={handleCameraError}
                className="camera-view"
              />
              <div className="camera-controls">
                <button
                  onClick={handleCameraCapture}
                  className="capture-button"
                >
                  Take Photo
                </button>
                <button onClick={switchCamera} className="switch-camera-button">
                  Switch Camera
                </button>
              </div>
              <div className="upload-option">
                <label className="upload-button">
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </>
          )}
        </div>
      )}

      {isAnalyzing && (
        <div className="analyzing-container">
          <h2>Analyzing your meal</h2>
          {analysisError && (
            <div className="error-message">
              <p>{analysisError}</p>
              <div className="error-actions">
                <button
                  onClick={() => setAnalysisError(null)}
                  className="retry-button"
                >
                  Try Again
                </button>
                <Link to="/" className="home-button">
                  Back to Home
                </Link>
              </div>
            </div>
          )}

          {!analysisError && (
            <>
              <div className="preview-container">
                {scannedImage ? (
                  <img
                    src={scannedImage}
                    alt="Scanned food"
                    className="food-preview"
                  />
                ) : (
                  <div className="preview-placeholder">
                    <div className="analyzing-text">Processing image...</div>
                  </div>
                )}
              </div>
              <div className="analyzing-status">
                <div className="analyzing-spinner"></div>
                <div className="analyzing-text">Analyzing ingredients...</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ScanFood;
