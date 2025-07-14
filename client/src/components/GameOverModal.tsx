import React from "react";
// Removed Dialog import to fix white screen issue
import { Button } from "@/components/ui/button";
import { Home, User } from "lucide-react";
import { useAudio } from "@/hooks/useAudio";

interface GameOverModalProps {
  open: boolean;
  onClose: () => void;
  result: any;
  onPlayAgain: () => void;
}

export function GameOverModal({ open, onClose, result, onPlayAgain }: GameOverModalProps) {
  const { playSound } = useAudio();
  
  if (!result) return null;

  const isWin = result.winner;
  const isDraw = result.condition === 'draw';
  const winnerSymbol = result.winner;
  const winnerName = result.winnerName;
  const winnerInfo = result.winnerInfo; // This should contain profile info
  
  // Play celebration sound when modal opens
  React.useEffect(() => {
    if (open && !isDraw) {
      playSound('win');
    }
  }, [open, isDraw, playSound]);

  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-900 border-2 border-slate-600 text-white text-center max-w-md mx-4 p-8 rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-6">Game Over!</h2>
        
        <div className="mb-6">
          {isDraw ? (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-3xl">🤝</span>
              </div>
              <p className="text-xl text-gray-300">It's a Draw!</p>
            </div>
          ) : (
            <div className="text-center">
              {/* Winner Profile Picture */}
              <div className="w-16 h-16 mx-auto mb-4">
                {winnerInfo?.profilePicture ? (
                  <img 
                    src={winnerInfo.profilePicture} 
                    alt="Winner" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              
              {/* Winner Name */}
              <p className="text-xl text-white mb-4">
                {winnerInfo?.displayName || winnerInfo?.firstName || winnerInfo?.username || `Player ${winnerSymbol}`} Wins!
              </p>
              
              {/* Win condition */}
              {result.condition && result.condition !== 'draw' && (
                <p className="text-sm text-gray-400">
                  {result.condition === 'horizontal' ? 'Horizontal line' : 'Diagonal line'}
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="flex justify-center space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-600 text-gray-300 hover:bg-slate-700"
          >
            <Home className="w-4 h-4 mr-2" />
            Main Menu
          </Button>
        </div>
      </div>
    </div>
  );
}
