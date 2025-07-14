import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, Home, Crown, User } from "lucide-react";
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white text-center max-w-md mx-auto focus:outline-none !bg-slate-800">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">Game Over!</DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          {isDraw ? (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-3xl">🤝</span>
              </div>
              <p className="text-xl text-gray-300">It's a Draw!</p>
            </div>
          ) : (
            <div className="text-center">
              {/* Winner Profile Picture with Crown */}
              <div className="relative w-20 h-20 mx-auto mb-4">
                {winnerInfo?.profilePicture ? (
                  <img 
                    src={winnerInfo.profilePicture} 
                    alt="Winner" 
                    className="w-20 h-20 rounded-full object-cover border-4 border-yellow-400"
                  />
                ) : (
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center border-4 border-yellow-400">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
                {/* Crown on top */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                </div>
              </div>
              
              {/* Winner Name */}
              <p className="text-xl text-white mb-2">
                {winnerInfo?.displayName || winnerInfo?.firstName || winnerInfo?.username || `Player ${winnerSymbol}`} Wins!
              </p>
              
              {/* Celebration sparkles */}
              <div className="text-2xl mb-4">
                ✨ 🎉 ✨
              </div>
              
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
      </DialogContent>
    </Dialog>
  );
}
