import { cn } from '../../lib/utils';
import { Clock, ShieldCheck, Loader2, CheckCircle, Star, XCircle, AlertTriangle, Navigation, MapPin } from 'lucide-react';

interface Step {
  key: string;
  label: string;
  icon: React.ElementType;
}

const steps: Step[] = [
  { key: 'pending', label: 'Requested', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: ShieldCheck },
  { key: 'on_the_way', label: 'On the way', icon: Navigation },
  { key: 'arrived', label: 'Arrived', icon: MapPin },
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
  
  // Treat all failure states as "dead" so the progress bar stops
  const isDead = ['cancelled_by_customer', 'cancelled_by_provider', 'declined', 'expired', 'no_show'].includes(currentStatus);
  const isDisputed = customerConfirmationStatus === 'disputed';
  const isCompleted = currentStatus === 'completed';
  const isRated = isCompleted && customerConfirmationStatus === 'confirmed';

  // Determine the label to show on the right side if the booking failed
  let deadLabel = 'Cancelled';
  if (currentStatus === 'declined') deadLabel = 'Declined';
  if (currentStatus === 'expired') deadLabel = 'Expired';
  if (currentStatus === 'no_show') deadLabel = 'No Show';

  return (
    <div className="flex items-center w-full">
      {steps.map((step, idx) => {
        const StepIcon = step.icon;
        const isActive = idx <= statusIndex && !isDead;
        const isCurrent = idx === statusIndex && !isDead;
        const isStepAfterCompleted = step.key === 'rated' && isRated;
        const isFuture = idx > statusIndex && !isStepAfterCompleted;

        // Determine active line up to this step
        const lineActive = idx < statusIndex || (idx === statusIndex && isStepAfterCompleted);

        return (
          <div key={step.key} className="flex items-center flex-1">
            {/* Circle + label */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'relative flex items-center justify-center rounded-full transition-all duration-300 z-10',
                  size === 'sm' ? 'w-7 h-7' : 'w-9 h-9',
                  (isActive || isStepAfterCompleted) && !isDead && !isDisputed
                    ? 'bg-primary-600 text-white shadow-md'
                    : isDead || isDisputed
                    ? 'bg-red-100 text-red-500'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                <StepIcon
                  className={cn(
                    size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4',
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
                    'text-[10px] mt-1.5 font-medium text-center max-w-[60px] leading-tight',
                    (isActive || isStepAfterCompleted) && !isDead && !isDisputed
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
                  'flex-1 h-1 mx-1 rounded-full -mt-4 sm:-mt-5',
                  lineActive && !isDead && !isDisputed
                    ? 'bg-primary-500'
                    : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}

      {/* Failure States (Cancelled, Declined, Expired) */}
      {isDead && (
        <div className="ml-2 flex items-center gap-1 text-xs text-red-600 font-medium whitespace-nowrap">
          <XCircle className="h-4 w-4" /> {deadLabel}
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