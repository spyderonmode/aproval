import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

const VALID_POSITIONS = [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14];

interface GameBoardProps {
  game: any;
  onGameOver: (result: any) => void;
  gameMode: 'ai' | 'pass-play' | 'online';
  user: any;
}

export function GameBoard({ game, onGameOver, gameMode, user }: GameBoardProps) {
  const [board, setBoard] = useState<Record<string, string>>({});
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (game) {
      setBoard(game.board || {});
      setCurrentPlayer(game.currentPlayer || 'X');
    }
  }, [game]);

  const makeMoveMutation = useMutation({
    mutationFn: async (position: number) => {
      if (!game) {
        throw new Error('No active game');
      }
      return await apiRequest('POST', `/api/games/${game.id}/moves`, { position });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games', game?.id] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCellClick = (position: number) => {
    if (!game || game.status !== 'active') {
      toast({
        title: "Game not active",
        description: "Start a new game to play",
        variant: "destructive",
      });
      return;
    }

    if (board[position.toString()]) {
      toast({
        title: "Invalid move",
        description: "Position already occupied",
        variant: "destructive",
      });
      return;
    }

    // Check if it's the player's turn
    if (gameMode === 'online') {
      const isPlayerX = game.playerXId === user?.id;
      const isPlayerO = game.playerOId === user?.id;
      const playerSymbol = isPlayerX ? 'X' : 'O';
      
      if (currentPlayer !== playerSymbol) {
        toast({
          title: "Not your turn",
          description: "Wait for your opponent's move",
          variant: "destructive",
        });
        return;
      }
    }

    makeMoveMutation.mutate(position);
  };

  const resetGame = () => {
    setBoard({});
    setCurrentPlayer('X');
  };

  const renderCell = (position: number) => {
    const symbol = board[position.toString()];
    const isEmpty = !symbol;
    
    return (
      <div
        key={position}
        className={`
          w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer 
          border-2 border-transparent hover:border-primary transition-all duration-200
          ${isEmpty ? 'hover:bg-slate-600' : 'cursor-not-allowed'}
          ${makeMoveMutation.isPending ? 'opacity-50' : ''}
        `}
        onClick={() => handleCellClick(position)}
      >
        {symbol && (
          <span className={`text-2xl font-bold ${
            symbol === 'X' ? 'text-blue-500' : 'text-red-500'
          }`}>
            {symbol}
          </span>
        )}
        <span className="text-xs text-gray-500 absolute mt-12">{position}</span>
      </div>
    );
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Game Board</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-300">Player X</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-300">Player O</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Current Player Indicator */}
        <div className="mb-6 p-4 bg-slate-700 rounded-lg">
          <div className="flex items-center justify-center space-x-3">
            <div className="relative">
              <div className={`w-4 h-4 rounded-full ${
                currentPlayer === 'X' ? 'bg-blue-500' : 'bg-red-500'
              }`}></div>
              <div className={`absolute inset-0 w-4 h-4 rounded-full animate-ping ${
                currentPlayer === 'X' ? 'bg-blue-500' : 'bg-red-500'
              }`}></div>
            </div>
            <span className="text-lg font-medium">
              Player {currentPlayer}'s Turn
            </span>
          </div>
        </div>

        {/* 3x5 Game Grid */}
        <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
          {/* Row 1: 1,2,3,4 */}
          {[1, 2, 3, 4].map(renderCell)}
          
          {/* Row 2: 6,7,8,9 */}
          {[6, 7, 8, 9].map(renderCell)}
          
          {/* Row 3: 11,12,13,14 */}
          {[11, 12, 13, 14].map(renderCell)}
        </div>

        {/* Game Controls */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button 
            variant="destructive"
            onClick={resetGame}
            disabled={makeMoveMutation.isPending}
          >
            Reset Game
          </Button>
          <Button 
            variant="secondary"
            disabled={makeMoveMutation.isPending}
          >
            Undo Move
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
