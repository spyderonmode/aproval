import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number; // 0 to 100
  variant?: 'default' | 'tictactoe' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  variant = 'default',
  size = 'md',
  showPercentage = false,
  className
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  if (variant === 'tictactoe') {
    const segments = 9;
    const filledSegments = Math.floor((animatedProgress / 100) * segments);
    
    return (
      <div className={cn('flex flex-col items-center space-y-2', className)}>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: segments }).map((_, index) => {
            const isFilled = index < filledSegments;
            const isX = index % 2 === 0;
            const isO = index % 2 === 1;
            
            return (
              <div
                key={index}
                className={cn(
                  'w-8 h-8 rounded border-2 flex items-center justify-center text-sm font-bold transition-all duration-300',
                  isFilled ? (
                    isX ? 'bg-blue-900/20 border-blue-400/50 text-blue-400' : 
                    'bg-red-900/20 border-red-400/50 text-red-400'
                  ) : 'bg-slate-700 border-slate-600 text-slate-500'
                )}
              >
                {isFilled && (
                  <span className="animate-in fade-in-50 zoom-in-50 duration-300">
                    {isX ? 'X' : 'O'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {showPercentage && (
          <span className="text-sm text-slate-400">
            {Math.round(animatedProgress)}%
          </span>
        )}
      </div>
    );
  }

  if (variant === 'gradient') {
    return (
      <div className={cn('flex flex-col space-y-2', className)}>
        <div className={cn('bg-slate-700 rounded-full overflow-hidden', sizeClasses[size])}>
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 transition-all duration-500 ease-out"
            style={{ width: `${animatedProgress}%` }}
          />
        </div>
        {showPercentage && (
          <span className="text-sm text-slate-400 self-center">
            {Math.round(animatedProgress)}%
          </span>
        )}
      </div>
    );
  }

  // Default progress bar
  return (
    <div className={cn('flex flex-col space-y-2', className)}>
      <div className={cn('bg-slate-700 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className="h-full bg-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${animatedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <span className="text-sm text-slate-400 self-center">
          {Math.round(animatedProgress)}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;