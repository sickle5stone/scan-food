import "./InstallPrompt.css";

import { useEffect, useState } from "react";

// Define the BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if prompt has been shown before
    const hasShownPrompt = localStorage.getItem("installPromptShown");

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("Caught beforeinstallprompt event");
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();

      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Only show the prompt if it hasn't been shown before
      if (!hasShownPrompt) {
        // For testing purposes, show the prompt immediately
        // In production, you might want to delay this
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = () => {
    // Hide the prompt
    setShowPrompt(false);

    // Show the install prompt
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === "accepted") {
            console.log("User accepted the install prompt");
          } else {
            console.log("User dismissed the install prompt");
          }

          // Clear the saved prompt
          setDeferredPrompt(null);
        });
      } catch (err) {
        console.error("Error prompting to install:", err);
      }
    } else {
      console.log("No deferred prompt available to show");
    }

    // Mark that we've shown the prompt
    localStorage.setItem("installPromptShown", "true");
  };

  const handleCloseClick = () => {
    setShowPrompt(false);
    // Mark that we've shown the prompt
    localStorage.setItem("installPromptShown", "true");
  };

  // For debugging - uncomment this to force the prompt to show regardless of beforeinstallprompt
  // if (!showPrompt) {
  //   return (
  //     <button onClick={() => setShowPrompt(true)}>
  //       Debug: Show Install Prompt
  //     </button>
  //   );
  // }

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <div className="install-prompt-header">
          <h3>Add to Home Screen</h3>
          <button className="close-button" onClick={handleCloseClick}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="install-prompt-body">
          <div className="app-icon">📱</div>
          <p>
            Add Nutrition Scanner to your home screen for quick access and a
            better experience!
          </p>
        </div>
        <div className="install-prompt-footer">
          <button className="install-button" onClick={handleInstallClick}>
            Install App
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
