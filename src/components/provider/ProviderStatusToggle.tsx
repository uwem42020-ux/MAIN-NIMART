import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface ProviderStatusToggleProps {
  providerId: string;
  initialStatus: 'available' | 'busy' | 'away';
  onStatusChange?: (newStatus: string) => void;
}

const statusConfig = {
  available: { label: 'Active', icon: '/active.svg' },
  busy: { label: 'Busy', icon: '/busy.svg' },
  away: { label: 'Away', icon: '/away.svg' },
};

export function ProviderStatusToggle({ providerId, initialStatus, onStatusChange }: ProviderStatusToggleProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const updateStatus = async (newStatus: 'available' | 'busy' | 'away') => {
    if (newStatus === status) {
      setShowDropdown(false);
      return;
    }

    setIsUpdating(true);
    try {
      // ✅ Only update status — is_available stays true (providers remain visible)
      const { error } = await supabase
        .from('providers')
        .update({ status: newStatus })
        .eq('id', providerId);

      if (error) throw error;

      setStatus(newStatus);
      onStatusChange?.(newStatus);
      toast.success(`Status changed to ${newStatus}`);
    } catch (error: any) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
      setShowDropdown(false);
    }
  };

  const currentConfig = statusConfig[status];

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isUpdating}
        className={cn(
          "flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow transition",
          isUpdating && "opacity-50 cursor-not-allowed"
        )}
      >
        <img src={currentConfig.icon} alt={status} className="h-5 w-5" />
        <span className="text-sm font-medium text-gray-700">{currentConfig.label}</span>
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-10">
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => updateStatus(key as any)}
              className={cn(
                "w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50",
                status === key && "bg-gray-50"
              )}
            >
              <img src={config.icon} alt={key} className="h-4 w-4" />
              <span>{config.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}