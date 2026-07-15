// src/components/common/NimartSpinner.tsx
import { cn } from '../../lib/utils';

interface NimartSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function NimartSpinner({ size = 'md', className }: NimartSpinnerProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('relative flex items-center', sizeClasses[size])}>
        {/* Left half - moves UP */}
        <img
          src="/upanddownleft.png"
          alt=""
          className="h-full w-auto object-contain animate-float-up"
          style={{ animationDuration: '1.2s' }}
        />
        {/* Right half - moves DOWN */}
        <img
          src="/upanddownright.png"
          alt=""
          className="h-full w-auto object-contain -ml-1 animate-float-down"
          style={{ animationDuration: '1.2s' }}
        />
      </div>
    </div>
  );
}