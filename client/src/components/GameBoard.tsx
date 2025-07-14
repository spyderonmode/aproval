import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

const VALID_POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

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
      
      // For local games (AI and pass-play), handle moves locally
      if (game.id === 'local-game') {
        return handleLocalMove(position);
      }
      
      return await apiRequest('POST', `/api/games/${game.id}/moves`, { position });
    },
    onSuccess: () => {
      if (game && game.id !== 'local-game') {
        queryClient.invalidateQueries({ queryKey: ['/api/games', game?.id] });
      }
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

  const handleLocalMove = (position: number) => {
    if (!game) return;
    
    const newBoard = { ...board };
    newBoard[position.toString()] = currentPlayer;
    
    // Check for win condition (horizontal: 4 in a row, vertical: 3 in a column, diagonal: 3 in diagonal excluding columns 5,10,15)
    const checkWin = (board: Record<string, string>, player: string) => {
      // Check horizontal (4 consecutive)
      const rows = [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
        [11, 12, 13, 14, 15]
      ];
      
      for (const row of rows) {
        for (let i = 0; i <= row.length - 4; i++) {
          const positions = row.slice(i, i + 4);
          if (positions.every(pos => board[pos.toString()] === player)) {
            return true;
          }
        }
      }
      
      // Check vertical (3 consecutive)
      const columns = [
        [1, 6, 11], [2, 7, 12], [3, 8, 13], [4, 9, 14], [5, 10, 15]
      ];
      
      for (const column of columns) {
        if (column.every(pos => board[pos.toString()] === player)) {
          return true;
        }
      }
      
      // Check diagonal (3 consecutive, excluding columns 5,10,15)
      const diagonals = [
        [1, 7, 13], [2, 8, 14], // Main diagonals (excluding [3,9,15])
        [3, 7, 11], [4, 8, 12], // Anti-diagonals (excluding [5,9,13])
        [11, 7, 3], [12, 8, 4]  // Additional patterns (excluding those with 5,10,15)
      ];
      
      return diagonals.some(diagonal => 
        diagonal.every(pos => board[pos.toString()] === player)
      );
    };
    
    const checkDraw = (board: Record<string, string>) => {
      return VALID_POSITIONS.every(pos => board[pos.toString()]);
    };
    
    setBoard(newBoard);
    
    if (checkWin(newBoard, currentPlayer)) {
      onGameOver({
        winner: currentPlayer,
        condition: 'diagonal',
        board: newBoard
      });
      return;
    }
    
    if (checkDraw(newBoard)) {
      onGameOver({
        winner: null,
        condition: 'draw',
        board: newBoard
      });
      return;
    }
    
    // Switch player
    const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';
    setCurrentPlayer(nextPlayer);
    
    // Handle AI move
    if (gameMode === 'ai' && nextPlayer === 'O') {
      setTimeout(() => {
        makeAIMove(newBoard);
      }, 500);
    }
  };

  const makeAIMove = (currentBoard: Record<string, string>) => {
    const availableMoves = VALID_POSITIONS.filter(pos => !currentBoard[pos.toString()]);
    if (availableMoves.length === 0) return;
    
    // Simple AI: random move
    const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    
    const newBoard = { ...currentBoard };
    newBoard[randomMove.toString()] = 'O';
    
    setBoard(newBoard);
    
    // Check for AI win using same logic
    const checkWin = (board: Record<string, string>, player: string) => {
      // Check horizontal (4 consecutive)
      const rows = [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
        [11, 12, 13, 14, 15]
      ];
      
      for (const row of rows) {
        for (let i = 0; i <= row.length - 4; i++) {
          const positions = row.slice(i, i + 4);
          if (positions.every(pos => board[pos.toString()] === player)) {
            return true;
          }
        }
      }
      
      // Check vertical (3 consecutive)
      const columns = [
        [1, 6, 11], [2, 7, 12], [3, 8, 13], [4, 9, 14], [5, 10, 15]
      ];
      
      for (const column of columns) {
        if (column.every(pos => board[pos.toString()] === player)) {
          return true;
        }
      }
      
      // Check diagonal (3 consecutive, excluding columns 5,10,15)
      const diagonals = [
        [1, 7, 13], [2, 8, 14], // Main diagonals (excluding [3,9,15])
        [3, 7, 11], [4, 8, 12], // Anti-diagonals (excluding [5,9,13])
        [11, 7, 3], [12, 8, 4]  // Additional patterns (excluding those with 5,10,15)
      ];
      
      return diagonals.some(diagonal => 
        diagonal.every(pos => board[pos.toString()] === player)
      );
    };
    
    const checkDraw = (board: Record<string, string>) => {
      return VALID_POSITIONS.every(pos => board[pos.toString()]);
    };
    
    if (checkWin(newBoard, 'O')) {
      onGameOver({
        winner: 'O',
        condition: 'diagonal',
        board: newBoard
      });
      return;
    }
    
    if (checkDraw(newBoard)) {
      onGameOver({
        winner: null,
        condition: 'draw',
        board: newBoard
      });
      return;
    }
    
    setCurrentPlayer('X');
  };

  const handleCellClick = (position: number) => {
    if (!game || (game.status && game.status !== 'active')) {
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
        <div className="grid grid-cols-5 gap-3 max-w-lg mx-auto">
          {/* Row 1: 1,2,3,4,5 */}
          {[1, 2, 3, 4, 5].map(renderCell)}
          
          {/* Row 2: 6,7,8,9,10 */}
          {[6, 7, 8, 9, 10].map(renderCell)}
          
          {/* Row 3: 11,12,13,14,15 */}
          {[11, 12, 13, 14, 15].map(renderCell)}
        </div>

        {/* Game Controls */}
        <div className="mt-8 flex justify-center">
          <Button 
            variant="destructive"
            onClick={resetGame}
            disabled={makeMoveMutation.isPending}
          >
            Reset Game
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
