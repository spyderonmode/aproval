import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TicTacToeLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
}

export const TicTacToeLoader: React.FC<TicTacToeLoaderProps> = ({
  size = 'md',
  speed = 'normal',
  className
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [board, setBoard] = useState<('X' | 'O' | '')[]>(Array(9).fill(''));

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-48 h-48'
  };

  const cellSizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg'
  };

  const speedMs = {
    slow: 800,
    normal: 500,
    fast: 300
  };

  // Animation sequence: alternating X and O placements
  const animationSequence = [
    { position: 4, player: 'X' }, // Center
    { position: 0, player: 'O' }, // Top-left
    { position: 8, player: 'X' }, // Bottom-right
    { position: 2, player: 'O' }, // Top-right
    { position: 6, player: 'X' }, // Bottom-left
    { position: 1, player: 'O' }, // Top-center
    { position: 7, player: 'X' }, // Bottom-center
    { position: 3, player: 'O' }, // Left-center
    { position: 5, player: 'X' }, // Right-center
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const nextStep = (prev + 1) % (animationSequence.length + 2);
        
        if (nextStep === 0) {
          // Reset board
          setBoard(Array(9).fill(''));
          return 0;
        } else if (nextStep <= animationSequence.length) {
          // Place next piece
          const move = animationSequence[nextStep - 1];
          setBoard(prevBoard => {
            const newBoard = [...prevBoard];
            newBoard[move.position] = move.player;
            return newBoard;
          });
          return nextStep;
        } else {
          // Pause with full board
          return nextStep;
        }
      });
    }, speedMs[speed]);

    return () => clearInterval(interval);
  }, [speed]);

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className={cn('grid grid-cols-3 gap-1 p-2 bg-slate-800 rounded-lg', sizeClasses[size])}>
        {board.map((cell, index) => (
          <div
            key={index}
            className={cn(
              'bg-slate-700 rounded border-2 border-slate-600 flex items-center justify-center font-bold transition-all duration-300',
              cellSizeClasses[size],
              cell === 'X' ? 'text-blue-400 border-blue-400/50 bg-blue-900/20' : 
              cell === 'O' ? 'text-red-400 border-red-400/50 bg-red-900/20' : 
              'hover:bg-slate-600'
            )}
          >
            {cell && (
              <span className="animate-in fade-in-50 zoom-in-50 duration-300">
                {cell}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex space-x-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-2 h-2 rounded-full bg-slate-400 animate-pulse',
              i === (currentStep % 3) ? 'bg-blue-400' : 'bg-slate-600'
            )}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default TicTacToeLoader;