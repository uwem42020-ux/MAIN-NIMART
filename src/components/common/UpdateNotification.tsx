// src/components/common/UpdateNotification.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

export function UpdateNotification() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const swRef = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Handler for a registration update
      const handler = (registration: ServiceWorkerRegistration) => {
        if (registration.waiting) {
          setNeedRefresh(true);
          swRef.current = registration.waiting;
        } else {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setNeedRefresh(true);
                  swRef.current = newWorker;
                }
              });
            }
          });
        }
      };

      // Check for a waiting worker on first load
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          if (reg.waiting) {
            setNeedRefresh(true);
            swRef.current = reg.waiting;
          }
          // Listen for controller change to reload automatically
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
          });
        }
      });

      // Listen for new registration updates
      navigator.serviceWorker.addEventListener('updatefound', () => {
        // Access the registration through the controller (cast to any for TypeScript)
        const registration = (navigator.serviceWorker.controller as any)?.registration;
        if (registration) handler(registration);
      });
    }
  }, []);

  const updateServiceWorker = () => {
    if (swRef.current) {
      swRef.current.postMessage({ type: 'SKIP_WAITING' });
      // After skip waiting, the controllerchange event will reload the page
    }
    setNeedRefresh(false);
  };

  if (!needRefresh || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <div className="bg-primary-600 text-white rounded-xl shadow-lg p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">New version available</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={updateServiceWorker}
            className="bg-white text-primary-600 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-gray-100"
          >
            Update
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/70 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}