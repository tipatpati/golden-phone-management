import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type ExchangeStep = 'client' | 'trade_in' | 'purchase' | 'payment' | 'review';

interface ExchangeWizardStepsProps {
  currentStep: ExchangeStep;
}

const steps: { id: ExchangeStep; label: string }[] = [
  { id: 'client', label: 'Cliente' },
  { id: 'trade_in', label: 'Permuta' },
  { id: 'purchase', label: 'Acquisto' },
  { id: 'payment', label: 'Pagamento' },
  { id: 'review', label: 'Conferma' },
];

export function ExchangeWizardSteps({ currentStep }: ExchangeWizardStepsProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors',
                  isCompleted && 'bg-green-500 text-white',
                  isCurrent && 'bg-blue-500 text-white',
                  !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-sm mt-2 font-medium',
                  isCurrent && 'text-foreground',
                  !isCurrent && 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2',
                  index < currentIndex ? 'bg-green-500' : 'bg-muted'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
