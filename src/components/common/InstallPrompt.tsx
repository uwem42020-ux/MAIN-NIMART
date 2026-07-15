import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; // Already installed, don't show
    }

    // Listen for the install prompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 3 seconds on site
      setTimeout(() => {
        if (!dismissed) setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Hide if user dismisses
    const dismissHandler = () => setDismissed(true);
    window.addEventListener('appinstalled', dismissHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', dismissHandler);
    };
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 animate-in slide-in-from-bottom">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
            <Download className="h-5 w-5 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">Install Nimart App</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Add to your home screen for quick access and a better experience.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-2 bg-primary-600 text-white text-xs font-medium rounded-xl hover:bg-primary-700 transition"
              >
                Install
              </button>
              <button
                onClick={() => setShowPrompt(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-xl hover:bg-gray-50 transition"
              >
                Later
              </button>
            </div>
            {/* iOS hint — shown only on iOS Safari, not in standalone mode */}
            {/iPhone|iPad|iPod/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches && (
              <div className="mt-2 text-[10px] text-gray-400 text-center">
                On iPhone? Tap <span className="font-semibold">Share</span> → <span className="font-semibold">Add to Home Screen</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowPrompt(false)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
