// src/components/common/LoadingSkeleton.tsx
import { NimartSpinner } from './NimartSpinner';

export function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white/50">
      <NimartSpinner size="lg" />
    </div>
  );
}