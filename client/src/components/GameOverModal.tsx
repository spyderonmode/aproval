import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, Home } from "lucide-react";

interface GameOverModalProps {
  open: boolean;
  onClose: () => void;
  result: any;
  onPlayAgain: () => void;
}

export function GameOverModal({ open, onClose, result, onPlayAgain }: GameOverModalProps) {
  if (!result) return null;

  const isWin = result.winner;
  const isDraw = result.condition === 'draw';
  const winnerSymbol = result.player;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl">Game Over!</DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full">
            {isDraw ? (
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">🤝</span>
              </div>
            ) : (
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                winnerSymbol === 'X' ? 'bg-blue-500' : 'bg-red-500'
              }`}>
                {isWin ? (
                  <Trophy className="w-8 h-8 text-white" />
                ) : (
                  <span className="text-2xl font-bold text-white">{winnerSymbol}</span>
                )}
              </div>
            )}
          </div>
          
          <div className="mb-4">
            {isDraw ? (
              <p className="text-lg text-gray-300">It's a Draw!</p>
            ) : (
              <p className="text-lg text-gray-300">
                Player {winnerSymbol} Wins!
              </p>
            )}
            {result.condition && result.condition !== 'draw' && (
              <p className="text-sm text-gray-400 mt-2">
                {result.condition === 'horizontal' ? 'Horizontal line' : 'Diagonal line'}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex justify-center space-x-3">
          <Button
            onClick={onPlayAgain}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
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
