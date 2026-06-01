import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { canInstall, isStandalone } from "../../utils/pwa";

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already installed
    if (isStandalone()) {
      return;
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Show prompt on iOS/Safari (no beforeinstallprompt event)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if ((isIOS || isSafari) && canInstall()) {
      setTimeout(() => setShowPrompt(true), 3000); // Show after 3 seconds
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response: ${outcome}`);
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("installPromptDismissed", "true");
  };

  // Don't show if dismissed recently
  if (localStorage.getItem("installPromptDismissed")) {
    return null;
  }

  if (!showPrompt || isStandalone()) {
    return null;
  }

  // iOS/Safari instructions
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50 animate-in slide-in-from-bottom">
      <div className="bg-card border border-primary/30 rounded-2xl shadow-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium mb-2">Install Your Rhythm</h3>
            {isIOS || isSafari ? (
              <div className="text-sm text-muted-foreground space-y-2">
                <p>To install this app on your iPhone/iPad:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Tap the Share button</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to confirm</li>
                </ol>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Install this app on your home screen for quick access and a better experience.
                </p>
                <button
                  onClick={handleInstallClick}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all"
                >
                  Install App
                </button>
              </>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
