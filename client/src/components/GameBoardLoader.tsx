import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface GameBoardLoaderProps {
  message?: string;
  className?: string;
}

export const GameBoardLoader: React.FC<GameBoardLoaderProps> = ({
  message = 'Loading game...',
  className
}) => {
  const [filledCells, setFilledCells] = useState<Set<number>>(new Set());
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');

  // Create a 3x5 grid (15 cells) like the actual game
  const totalCells = 15;

  useEffect(() => {
    const interval = setInterval(() => {
      setFilledCells(prev => {
        const newSet = new Set(prev);
        
        // If all cells are filled, reset
        if (newSet.size >= totalCells) {
          setCurrentPlayer('X');
          return new Set();
        }
        
        // Add a random empty cell
        let randomCell;
        do {
          randomCell = Math.floor(Math.random() * totalCells);
        } while (newSet.has(randomCell));
        
        newSet.add(randomCell);
        
        // Alternate player
        setCurrentPlayer(prev => prev === 'X' ? 'O' : 'X');
        
        return newSet;
      });
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn('flex flex-col items-center space-y-6', className)}>
      <div className="grid grid-cols-5 gap-2 p-4 bg-slate-800 rounded-lg">
        {Array.from({ length: totalCells }).map((_, index) => {
          const isActive = filledCells.has(index);
          const player = isActive ? (index % 2 === 0 ? 'X' : 'O') : '';
          
          return (
            <div
              key={index}
              className={cn(
                'w-12 h-12 bg-slate-700 rounded border-2 border-slate-600 flex items-center justify-center font-bold text-lg transition-all duration-300',
                isActive && player === 'X' ? 'text-blue-400 border-blue-400/50 bg-blue-900/20' : 
                isActive && player === 'O' ? 'text-red-400 border-red-400/50 bg-red-900/20' : 
                'hover:bg-slate-600',
                isActive && 'scale-110'
              )}
            >
              {isActive && (
                <span className="animate-in fade-in-50 zoom-in-50 duration-300">
                  {player}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="text-center">
        <p className="text-slate-300 text-lg font-medium">{message}</p>
        <div className="flex justify-center mt-2">
          <div className="flex space-x-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"
                style={{
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '1.5s'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoardLoader;