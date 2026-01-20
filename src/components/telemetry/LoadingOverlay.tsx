import { memo } from 'react';
import { Progress } from '@/components/ui/progress';

interface LoadingOverlayProps {
  isVisible: boolean;
  progress: number;
  message?: string;
}

export const LoadingOverlay = memo(function LoadingOverlay({ 
  isVisible, 
  progress,
  message = 'Generating telemetry data...'
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <div className="w-full max-w-md p-8 space-y-6 text-center">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            {message}
          </h2>
          <p className="text-sm text-muted-foreground">
            Processing {Math.round(progress)}% complete
          </p>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        <div className="flex justify-center">
          <div className="animate-pulse">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div 
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  style={{ 
                    animationDelay: `${i * 0.15}s`,
                    animation: 'pulse 1s ease-in-out infinite'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
