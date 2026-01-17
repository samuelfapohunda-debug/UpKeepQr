interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export default function ProgressIndicator({ 
  currentStep, 
  totalSteps,
  stepLabels = []
}: ProgressIndicatorProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8" data-testid="progress-indicator">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                transition-all duration-300 font-semibold
                ${
                  i + 1 < currentStep
                    ? 'bg-green-500 text-white'
                    : i + 1 === currentStep
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }
              `}
              data-testid={`progress-step-${i + 1}`}
            >
              {i + 1 < currentStep ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                i + 1
              )}
            </div>

            {i < totalSteps - 1 && (
              <div
                className={`
                  w-12 h-1 mx-1 transition-all duration-300
                  ${i + 1 < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}
                `}
              />
            )}
          </div>
        ))}
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {stepLabels[currentStep - 1] && (
        <p className="text-center mt-2 text-sm font-medium text-muted-foreground">
          {stepLabels[currentStep - 1]}
        </p>
      )}
    </div>
  );
}
