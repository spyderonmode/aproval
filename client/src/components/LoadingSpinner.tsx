import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'grid' | 'dots' | 'pulse';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  if (variant === 'grid') {
    return (
      <div className={cn('inline-block', className)}>
        <div className={cn('grid grid-cols-3 gap-1', sizeClasses[size])}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'bg-current rounded-sm animate-pulse',
                'w-full h-full opacity-60'
              )}
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1.5s'
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center space-x-1', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'bg-current rounded-full animate-bounce',
              size === 'sm' ? 'w-2 h-2' : 
              size === 'md' ? 'w-3 h-3' : 
              size === 'lg' ? 'w-4 h-4' : 'w-5 h-5'
            )}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1.4s'
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('animate-pulse', sizeClasses[size], className)}>
        <div className="bg-current rounded-lg w-full h-full opacity-60" />
      </div>
    );
  }

  // Default spinning circle
  return (
    <div className={cn('animate-spin', sizeClasses[size], className)}>
      <div className="border-2 border-current border-t-transparent rounded-full w-full h-full" />
    </div>
  );
};

export default LoadingSpinner;