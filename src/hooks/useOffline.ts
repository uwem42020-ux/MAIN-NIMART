// src/hooks/useOffline.ts
import { useEffect, useState } from 'react';

export function useOffline() {
  // 🔥 FIX: Start as false so SSR doesn't crash (navigator is undefined on server)
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Set the actual state once mounted on the client
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOffline;
}