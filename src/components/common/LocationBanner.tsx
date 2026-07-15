import { Link } from 'react-router-dom';
import { useLocationStore } from '../../stores/locationStore';
import { useAuth } from '../../contexts/AuthContext';
import { MapPin, X } from 'lucide-react';
import { useState } from 'react';

export function LocationBanner() {
  const { user } = useAuth();
  const { permissionDenied } = useLocationStore();
  const [dismissed, setDismissed] = useState(false);

  // Show only if: location denied AND user not logged in AND not dismissed
  if (!permissionDenied || user || dismissed) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <MapPin className="h-4 w-4" />
            <span>
              <Link to="/auth/signin" className="font-medium underline">Sign in</Link> or{' '}
              <Link to="/auth/signup" className="font-medium underline">create an account</Link> to see providers near you!
            </span>
          </div>
          <button onClick={() => setDismissed(true)} className="text-blue-600 hover:text-blue-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}