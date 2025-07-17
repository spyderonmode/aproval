import React from 'react';
import { cn } from '@/lib/utils';
import { TicTacToeLoader } from './TicTacToeLoader';
import { GameBoardLoader } from './GameBoardLoader';
import { ProgressBar } from './ProgressBar';

interface LoadingScreenProps {
  variant?: 'tictactoe' | 'gameboard' | 'progress';
  message?: string;
  progress?: number;
  fullscreen?: boolean;
  className?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  variant = 'tictactoe',
  message = 'Loading...',
  progress,
  fullscreen = false,
  className
}) => {
  const containerClasses = fullscreen 
    ? 'fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center'
    : 'flex items-center justify-center p-8';

  const renderLoader = () => {
    switch (variant) {
      case 'gameboard':
        return <GameBoardLoader message={message} />;
      case 'progress':
        return (
          <div className="flex flex-col items-center space-y-6">
            <TicTacToeLoader size="lg" />
            <div className="text-center">
              <p className="text-slate-300 text-lg font-medium mb-4">{message}</p>
              {progress !== undefined && (
                <ProgressBar 
                  progress={progress} 
                  variant="tictactoe" 
                  showPercentage 
                  className="w-64"
                />
              )}
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center space-y-4">
            <TicTacToeLoader size="lg" />
            <p className="text-slate-300 text-lg font-medium">{message}</p>
          </div>
        );
    }
  };

  return (
    <div className={cn(containerClasses, className)}>
      <div className="text-center">
        {renderLoader()}
      </div>
    </div>
  );
};

export default LoadingScreen;