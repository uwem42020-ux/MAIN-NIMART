// src/components/common/InstallPrompt.tsx
'use client';

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
    // Already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Check sessionStorage so it doesn't re‑appear in the same session
    if (sessionStorage.getItem('pwa-prompt-dismissed')) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 3 seconds on site
      setTimeout(() => {
        if (!dismissed) setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

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

  const dismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="w-full bg-primary-600 text-white px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0">
        <Download className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm font-medium truncate">
          Add Nimart to your home screen for quick access
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="bg-white text-primary-700 px-3 py-1 rounded text-xs font-semibold hover:bg-gray-100"
        >
          Install
        </button>
        <button onClick={dismiss} className="text-white/80 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* iOS hint for Safari */}
      {/iPhone|iPad|iPod/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches && (
        <div className="mt-1 text-[10px] text-white/70 text-center">
          On iPhone? Tap <span className="font-semibold">Share</span> → <span className="font-semibold">Add to Home Screen</span>
        </div>
      )}
    </div>
  );
};