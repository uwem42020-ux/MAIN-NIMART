import { cn } from '../../lib/utils';
import { Clock, ShieldCheck, Loader2, CheckCircle, Star, XCircle, AlertTriangle } from 'lucide-react';

interface Step {
  key: string;
  label: string;
  icon: React.ElementType;
}

const steps: Step[] = [
  { key: 'pending', label: 'Requested', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: ShieldCheck },
  { key: 'in_progress', label: 'In Progress', icon: Loader2 },
  { key: 'completed', label: 'Completed', icon: CheckCircle },
  { key: 'rated', label: 'Rated', icon: Star },
];

interface BookingStatusTimelineProps {
  currentStatus: string;
  customerConfirmationStatus?: string;
  size?: 'sm' | 'md';
}

export function BookingStatusTimeline({
  currentStatus,
  customerConfirmationStatus,
  size = 'md',
}: BookingStatusTimelineProps) {
  const statusIndex = steps.findIndex(s => s.key === currentStatus);
  const isCancelled = currentStatus.startsWith('cancelled');
  const isDisputed = customerConfirmationStatus === 'disputed';
  const isCompleted = currentStatus === 'completed';
  const isRated = isCompleted && customerConfirmationStatus === 'confirmed';

  return (
    <div className="flex items-center w-full">
      {steps.map((step, idx) => {
        const StepIcon = step.icon;
        const isActive = idx <= statusIndex && !isCancelled;
        const isCurrent = idx === statusIndex && !isCancelled;
        const isStepAfterCompleted = step.key === 'rated' && isRated;
        const isFuture = idx > statusIndex && !isStepAfterCompleted;

        // Determine active line up to this step
        const lineActive =
          idx < statusIndex || (idx === statusIndex && isStepAfterCompleted);

        return (
          <div key={step.key} className="flex items-center flex-1">
            {/* Circle + label */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'relative flex items-center justify-center rounded-full transition-all duration-300 z-10',
                  size === 'sm' ? 'w-8 h-8' : 'w-10 h-10',
                  (isActive || isStepAfterCompleted) && !isCancelled && !isDisputed
                    ? 'bg-primary-600 text-white shadow-md'
                    : isCancelled || isDisputed
                    ? 'bg-red-100 text-red-500'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                <StepIcon
                  className={cn(
                    size === 'sm' ? 'w-4 h-4' : 'w-5 h-5',
                    isCurrent && 'animate-pulse'
                  )}
                />
                {isCurrent && (
                  <span className="absolute inset-0 rounded-full bg-primary-600 opacity-25 animate-ping" />
                )}
              </div>
              {size === 'md' && (
                <span
                  className={cn(
                    'text-xs mt-1 font-medium',
                    (isActive || isStepAfterCompleted) && !isCancelled && !isDisputed
                      ? 'text-primary-700'
                      : 'text-gray-400',
                    isCurrent && 'text-primary-700 font-semibold'
                  )}
                >
                  {step.label}
                </span>
              )}
            </div>

            {/* Connector line (except last step) */}
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-1 mx-1 rounded-full',
                  lineActive && !isCancelled && !isDisputed
                    ? 'bg-primary-500'
                    : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}

      {isCancelled && (
        <div className="ml-2 flex items-center gap-1 text-xs text-red-600 font-medium whitespace-nowrap">
          <XCircle className="h-4 w-4" /> Cancelled
        </div>
      )}
      {isDisputed && (
        <div className="ml-2 flex items-center gap-1 text-xs text-orange-600 font-medium whitespace-nowrap">
          <AlertTriangle className="h-4 w-4" /> Disputed
        </div>
      )}
    </div>
  );
}