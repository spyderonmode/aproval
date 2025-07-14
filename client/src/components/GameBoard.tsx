import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAudio } from "@/hooks/useAudio";
import { useWebSocket } from "@/hooks/useWebSocket";
import { isUnauthorizedError } from "@/lib/authUtils";
import { motion, AnimatePresence } from "framer-motion";

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
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [lastMove, setLastMove] = useState<number | null>(null);
  const { toast } = useToast();
  const { playSound } = useAudio();
  const { lastMessage } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (game) {
      console.log('🎮 Game prop changed:', game);
      console.log('📋 Setting board to:', game.board || {});
      setBoard(game.board || {});
      setCurrentPlayer(game.currentPlayer || 'X');
    }
  }, [game]);

  // Handle WebSocket messages for online games
  useEffect(() => {
    if (gameMode === 'online' && lastMessage && game) {
      console.log('🎮 Processing WebSocket message:', lastMessage.type);
      switch (lastMessage.type) {
        case 'move':
          if (lastMessage.gameId === game.id) {
            console.log('🎮 Received move WebSocket message:', lastMessage);
            console.log('📋 Current board state:', board);
            console.log('📋 New board state:', lastMessage.board);
            console.log('📋 Position:', lastMessage.position);
            console.log('📋 Current player:', lastMessage.currentPlayer);
            
            // Force state update immediately
            setBoard(prevBoard => {
              console.log('📋 Updating board from:', prevBoard, 'to:', lastMessage.board);
              return lastMessage.board;
            });
            setCurrentPlayer(lastMessage.currentPlayer);
            setLastMove(lastMessage.position);
            playSound('move');
            // Force query invalidation to ensure UI updates
            queryClient.invalidateQueries({ queryKey: ['/api/games', game?.id] });
          }
          break;
        case 'game_started':
          console.log('🎮 GameBoard received game_started message:', lastMessage);
          console.log('🎮 Game roomId:', game?.roomId);
          console.log('🎮 Message roomId:', lastMessage.roomId);
          if (lastMessage.roomId === game?.roomId || lastMessage.game?.id === game?.id) {
            console.log('🎮 Game started WebSocket message:', lastMessage);
            console.log('📋 Game started board:', lastMessage.game.board || {});
            // Update the game with the new player information
            setBoard(lastMessage.game.board || {});
            setCurrentPlayer(lastMessage.game.currentPlayer || 'X');
            // Force a re-render to ensure the board updates
            queryClient.invalidateQueries({ queryKey: ['/api/games', game?.id] });
          }
          break;
        case 'game_over':
          if (lastMessage.gameId === game.id) {
            onGameOver({
              winner: lastMessage.winner,
              condition: lastMessage.condition,
              board: lastMessage.board
            });
          }
          break;
      }
    }
  }, [lastMessage, gameMode, game, onGameOver, playSound]);

  // Debug effect to track board state changes
  useEffect(() => {
    console.log('🔄 Board state changed:', board);
    console.log('🔄 Board keys:', Object.keys(board));
    console.log('🔄 Board values:', Object.values(board));
  }, [board]);

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
    onSuccess: (data) => {
      console.log('🎯 Move mutation success:', data);
      if (game && game.id !== 'local-game') {
        // For online games, don't update local state immediately
        // Let the WebSocket message handle the update to ensure synchronization
        console.log('✅ Move successful, waiting for WebSocket update');
        queryClient.invalidateQueries({ queryKey: ['/api/games', game?.id] });
      }
    },
    onError: (error) => {
      console.log('❌ Move mutation error:', error);
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
    
    playSound('move');
    const newBoard = { ...board };
    newBoard[position.toString()] = currentPlayer;
    setBoard(newBoard);
    setLastMove(position);
    
    // Check for win condition with winning line detection
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
            setWinningLine(positions);
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
          setWinningLine(column);
          return true;
        }
      }
      
      // Check diagonal (3 consecutive, excluding columns 5,10,15)
      const diagonals = [
        [1, 7, 13], [2, 8, 14], // Main diagonals (excluding [3,9,15])
        [3, 7, 11], [4, 8, 12], // Anti-diagonals (excluding [5,9,13])
        [11, 7, 3], [12, 8, 4]  // Additional patterns (excluding those with 5,10,15)
      ];
      
      for (const diagonal of diagonals) {
        if (diagonal.every(pos => board[pos.toString()] === player)) {
          setWinningLine(diagonal);
          return true;
        }
      }
      
      return false;
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
    
    playSound('move');
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
    console.log('🎯 Cell click - Position:', position);
    console.log('📋 Current board state:', board);
    console.log('👤 Current player:', currentPlayer);
    console.log('🎮 Game mode:', gameMode);
    console.log('🎲 Game object:', game);
    
    if (!game || (game.status && game.status !== 'active')) {
      console.log('❌ Game not active');
      toast({
        title: "Game not active",
        description: "Start a new game to play",
        variant: "destructive",
      });
      return;
    }

    if (board[position.toString()]) {
      console.log('❌ Position already occupied');
      toast({
        title: "Invalid move",
        description: "Position already occupied",
        variant: "destructive",
      });
      return;
    }

    // Check if it's the player's turn
    if (gameMode === 'online') {
      const userId = user?.userId || user?.id;
      const isPlayerX = game.playerXId === userId;
      const isPlayerO = game.playerOId === userId;
      
      console.log('🎭 Turn check:');
      console.log('  - User ID:', userId);
      console.log('  - Player X ID:', game.playerXId);
      console.log('  - Player O ID:', game.playerOId);
      console.log('  - Is Player X:', isPlayerX);
      console.log('  - Is Player O:', isPlayerO);
      
      if (!isPlayerX && !isPlayerO) {
        console.log('❌ User is not a player in this game');
        toast({
          title: "Not a player",
          description: "You are not a player in this game",
          variant: "destructive",
        });
        return;
      }
      
      const playerSymbol = isPlayerX ? 'X' : 'O';
      console.log('  - Player symbol:', playerSymbol);
      console.log('  - Current player turn:', currentPlayer);
      
      if (currentPlayer !== playerSymbol) {
        console.log('❌ Not your turn');
        const currentPlayerName = currentPlayer === 'X' ? 
          (game.playerXInfo?.firstName || 'Player X') : 
          (game.playerOInfo?.firstName || 'Player O');
        toast({
          title: "Not your turn",
          description: `Waiting for ${currentPlayerName} to make a move`,
          variant: "destructive",
        });
        return;
      }
    }

    console.log('✅ Making move on position:', position);
    playSound('move');
    makeMoveMutation.mutate(position);
  };

  const resetGame = () => {
    setBoard({});
    setCurrentPlayer('X');
    setWinningLine(null);
    setLastMove(null);
  };

  const renderCell = (position: number) => {
    const symbol = board[position.toString()];
    const isEmpty = !symbol;
    const isWinningCell = winningLine?.includes(position);
    const isLastMove = lastMove === position;
    
    return (
      <motion.div
        key={position}
        className={`
          w-12 h-12 sm:w-16 sm:h-16 bg-slate-700 rounded-lg flex items-center justify-center cursor-pointer 
          border-2 border-transparent hover:border-primary transition-all duration-200
          ${isEmpty ? 'hover:bg-slate-600' : 'cursor-not-allowed'}
          ${makeMoveMutation.isPending ? 'opacity-50' : ''}
          ${isWinningCell ? 'bg-green-600 border-green-400' : ''}
          ${isLastMove ? 'ring-2 ring-yellow-400' : ''}
        `}
        onClick={() => handleCellClick(position)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: isEmpty ? 1.05 : 1 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence>
          {symbol && (
            <motion.span
              className={`text-xl sm:text-2xl font-bold ${
                symbol === 'X' ? 'text-blue-500' : 'text-red-500'
              }`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              {symbol}
            </motion.span>
          )}
        </AnimatePresence>
        <span className="text-xs text-gray-500 absolute mt-10 sm:mt-12">{position}</span>
      </motion.div>
    );
  };

  const getLineCoordinates = (positions: number[]) => {
    // Get grid coordinates for line drawing
    const getGridPosition = (pos: number) => {
      const row = Math.floor((pos - 1) / 5);
      const col = (pos - 1) % 5;
      return { x: col * 20 + 10, y: row * 33.33 + 16.67 };
    };
    
    const start = getGridPosition(positions[0]);
    const end = getGridPosition(positions[positions.length - 1]);
    
    return {
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y
    };
  };

  const getSparklePosition = (position: number) => {
    const row = Math.floor((position - 1) / 5);
    const col = (position - 1) % 5;
    return { 
      x: col * 20 + 10,
      y: row * 33.33 + 16.67 
    };
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Game Board</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="flex items-center space-x-2">
                {game?.playerXInfo?.profilePicture ? (
                  <img 
                    src={game.playerXInfo.profilePicture} 
                    alt="Player X" 
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">X</span>
                  </div>
                )}
                <span className="text-sm text-gray-300">
                  {game?.playerXInfo?.displayName || game?.playerXInfo?.username || 'Player X'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="flex items-center space-x-2">
                {game?.playerOInfo?.profilePicture ? (
                  <img 
                    src={game.playerOInfo.profilePicture} 
                    alt="Player O" 
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">O</span>
                  </div>
                )}
                <span className="text-sm text-gray-300">
                  {game?.playerOInfo?.displayName || game?.playerOInfo?.username || (gameMode === 'ai' ? 'AI' : 'Player O')}
                </span>
              </div>
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
              {currentPlayer === 'X' 
                ? (game?.playerXInfo?.displayName || game?.playerXInfo?.username || 'Player X')
                : (game?.playerOInfo?.displayName || game?.playerOInfo?.username || (gameMode === 'ai' ? 'AI' : 'Player O'))
              }'s Turn
            </span>
          </div>
        </div>

        {/* 3x5 Game Grid */}
        <div 
          key={`board-${JSON.stringify(board)}`}
          className="relative grid grid-cols-5 gap-2 sm:gap-3 max-w-xs sm:max-w-lg mx-auto"
        >
          {/* Row 1: 1,2,3,4,5 */}
          {[1, 2, 3, 4, 5].map(renderCell)}
          
          {/* Row 2: 6,7,8,9,10 */}
          {[6, 7, 8, 9, 10].map(renderCell)}
          
          {/* Row 3: 11,12,13,14,15 */}
          {[11, 12, 13, 14, 15].map(renderCell)}
          
          {/* Winning Line Animation */}
          {winningLine && (
            <motion.div
              className="absolute inset-0 pointer-events-none z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="winningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#6ee7b7" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <motion.line
                  x1={getLineCoordinates(winningLine).x1}
                  y1={getLineCoordinates(winningLine).y1}
                  x2={getLineCoordinates(winningLine).x2}
                  y2={getLineCoordinates(winningLine).y2}
                  stroke="url(#winningGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  filter="url(#glow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                />
                <motion.line
                  x1={getLineCoordinates(winningLine).x1}
                  y1={getLineCoordinates(winningLine).y1}
                  x2={getLineCoordinates(winningLine).x2}
                  y2={getLineCoordinates(winningLine).y2}
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
                />
              </svg>
              {/* Sparkle effects */}
              {winningLine.map((position, index) => (
                <motion.div
                  key={position}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  style={{
                    left: `${getSparklePosition(position).x}%`,
                    top: `${getSparklePosition(position).y}%`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 1.5, 0],
                    opacity: [0, 1, 0],
                    rotate: [0, 360]
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: index * 0.1 + 0.5,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                />
              ))}
            </motion.div>
          )}
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
