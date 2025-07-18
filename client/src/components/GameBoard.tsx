import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
// useAudio hook removed as sound effects are removed
// Removed useWebSocket import - messages now come from parent component
import { isUnauthorizedError } from "@/lib/authUtils";
import { motion, AnimatePresence } from "framer-motion"; // Added back for winning line animation
import { useTheme } from "@/contexts/ThemeContext";
import { User, MessageCircle } from "lucide-react";
import { QuickChatPanel } from '@/components/QuickChatPanel';

const VALID_POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

// Player quick chat system
interface PlayerMessage {
  text: string;
  duration: number;
}

const QUICK_CHAT_MESSAGES = [
  { text: 'Good luck!', duration: 4000 },
  { text: 'Well played!', duration: 3500 },
  { text: 'Nice move!', duration: 3000 },
  { text: 'Great strategy!', duration: 3500 },
  { text: 'Play faster!', duration: 3000 },
  { text: 'Take your time', duration: 3500 },
  { text: 'Good game!', duration: 4000 },
  { text: 'Thanks for the game!', duration: 3000 },
  { text: 'One more?', duration: 3000 },
  { text: 'Impressive!', duration: 3500 },
  { text: 'Thinking...', duration: 4000 },
  { text: 'Ready to play!', duration: 3000 }
];

// Helper function to check if player has Legend achievement
const hasLegendAchievement = (achievements: any[]): boolean => {
  return achievements?.some(achievement => achievement.achievementType === 'legend') || false;
};

// Function to get winning positions for highlighting
const getWinningPositions = (board: Record<string, string>, player: string): number[] => {
  // Check horizontal wins
  const rows = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15]
  ];
  
  for (const row of rows) {
    for (let i = 0; i <= row.length - 4; i++) {
      const positions = row.slice(i, i + 4);
      if (positions.every(pos => board[pos.toString()] === player)) {
        return positions;
      }
    }
  }
  
  // Check vertical wins
  const columns = [
    [1, 6, 11], [2, 7, 12], [3, 8, 13], [4, 9, 14], [5, 10, 15]
  ];
  
  for (const column of columns) {
    if (column.every(pos => board[pos.toString()] === player)) {
      return column;
    }
  }
  
  // Check diagonal wins
  const diagonals = [
    [1, 7, 13], [2, 8, 14], [3, 7, 11], [4, 8, 12]
  ];
  
  for (const diagonal of diagonals) {
    if (diagonal.every(pos => board[pos.toString()] === player)) {
      return diagonal;
    }
  }
  
  return [];
};

// AI helper functions for different difficulty levels
const findBestMove = (board: Record<string, string>, availableMoves: number[]): number | null => {
  // Try to win first
  for (const move of availableMoves) {
    const testBoard = { ...board, [move.toString()]: 'O' };
    if (checkWinSimple(testBoard, 'O')) {
      return move;
    }
  }
  
  // Try to block player win
  for (const move of availableMoves) {
    const testBoard = { ...board, [move.toString()]: 'X' };
    if (checkWinSimple(testBoard, 'X')) {
      return move;
    }
  }
  
  return null;
};

const findBestMoveHard = (board: Record<string, string>, availableMoves: number[]): number | null => {
  // Try to win first
  for (const move of availableMoves) {
    const testBoard = { ...board, [move.toString()]: 'O' };
    if (checkWinSimple(testBoard, 'O')) {
      return move;
    }
  }
  
  // Try to block player win
  for (const move of availableMoves) {
    const testBoard = { ...board, [move.toString()]: 'X' };
    if (checkWinSimple(testBoard, 'X')) {
      return move;
    }
  }
  
  // Strategic positioning: prefer center and corners
  const strategicMoves = [8, 1, 3, 11, 13, 7, 9]; // Center first, then corners and edges
  for (const move of strategicMoves) {
    if (availableMoves.includes(move)) {
      return move;
    }
  }
  
  return null;
};

const checkWinSimple = (board: Record<string, string>, player: string): boolean => {
  // Check horizontal (4 in a row)
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
  
  // Check vertical (3 in a column)
  const columns = [
    [1, 6, 11], [2, 7, 12], [3, 8, 13], [4, 9, 14], [5, 10, 15]
  ];
  
  for (const column of columns) {
    if (column.every(pos => board[pos.toString()] === player)) {
      return true;
    }
  }
  
  // Check diagonal (3 in diagonal, excluding columns 5, 10, 15)
  const diagonals = [
    [1, 7, 13], [2, 8, 14], [3, 7, 11], [4, 8, 12]
  ];
  
  for (const diagonal of diagonals) {
    if (diagonal.every(pos => board[pos.toString()] === player)) {
      return true;
    }
  }
  
  return false;
};

interface GameBoardProps {
  game: any;
  onGameOver: (result: any) => void;
  gameMode: 'ai' | 'pass-play' | 'online';
  user: any;
  lastMessage?: any;
  sendMessage?: (message: any) => void;
}

export function GameBoard({ game, onGameOver, gameMode, user, lastMessage, sendMessage }: GameBoardProps) {
  const [board, setBoard] = useState<Record<string, string>>({});
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [lastMove, setLastMove] = useState<number | null>(null);
  
  const [opponent, setOpponent] = useState<any>(null);
  
  // Player chat message state
  const [playerXMessage, setPlayerXMessage] = useState<PlayerMessage | null>(null);
  const [playerOMessage, setPlayerOMessage] = useState<PlayerMessage | null>(null);
  const [messageTimeouts, setMessageTimeouts] = useState<{ X?: NodeJS.Timeout; O?: NodeJS.Timeout }>({});
  const [showChatPanel, setShowChatPanel] = useState(false);
  
  // Update winning line when game has winning positions
  useEffect(() => {
    if (game?.winningPositions) {
      setWinningLine(game.winningPositions);
    }
  }, [game?.winningPositions]);
  const { toast } = useToast();
  const { currentTheme, themes } = useTheme();
  // Sound effects removed as requested
  // WebSocket now handled by parent component
  const queryClient = useQueryClient();

  // Determine opponent for online games
  useEffect(() => {
    if (gameMode === 'online' && game && user) {
      const userIsPlayerX = game.playerXId === (user.userId || user.id);
      const userIsPlayerO = game.playerOId === (user.userId || user.id);
      
      if (userIsPlayerX && game.playerOInfo) {
        setOpponent(game.playerOInfo);
      } else if (userIsPlayerO && game.playerXInfo) {
        setOpponent(game.playerXInfo);
      }
    }
  }, [game, user, gameMode]);

  // Player message functions
  const setPlayerMessage = (player: 'X' | 'O', messageText: string) => {
    const message = QUICK_CHAT_MESSAGES.find(msg => msg.text === messageText) || { text: messageText, duration: 3000 };
    
    // Clear existing timeout
    if (messageTimeouts[player]) {
      clearTimeout(messageTimeouts[player]);
    }
    
    // Set new message
    if (player === 'X') {
      setPlayerXMessage(message);
    } else {
      setPlayerOMessage(message);
    }
    
    // Clear message after duration
    const timeout = setTimeout(() => {
      if (player === 'X') {
        setPlayerXMessage(null);
      } else {
        setPlayerOMessage(null);
      }
      setMessageTimeouts(prev => ({ ...prev, [player]: undefined }));
    }, message.duration);
    
    setMessageTimeouts(prev => ({ ...prev, [player]: timeout }));
  };

  const handleMessageClick = (messageText: string) => {
    if (gameMode === 'online' && user) {
      const userId = user.userId || user.id;
      const isPlayerX = game.playerXId === userId;
      const playerSymbol = isPlayerX ? 'X' : 'O';
      
      // Show message locally first
      setPlayerMessage(playerSymbol, messageText);
      
      // Broadcast message to all players and spectators in the room
      const chatMessage = {
        type: 'player_chat',
        roomId: game.roomId,
        gameId: game.id,
        userId: userId,
        playerSymbol: playerSymbol,
        messageText: messageText,
        playerInfo: isPlayerX ? game.playerXInfo : game.playerOInfo
      };
      
      // Send via WebSocket
      if (sendMessage) {
        sendMessage(chatMessage);
      }
    } else {
      // For local games, current player uses message
      setPlayerMessage(currentPlayer, messageText);
    }
    setShowChatPanel(false);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(messageTimeouts).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [messageTimeouts]);





  useEffect(() => {
    if (game) {
      console.log('🎮 Game prop changed:', game);
      console.log('🎮 Game ID:', game.id);
      console.log('📋 Game board from prop:', game.board || {});
      
      const gameBoard = game.board || {};
      const isNewGame = Object.keys(gameBoard).length === 0;
      
      // For local games, only set board if it's truly empty (new game)
      if (game.id.startsWith('local-game')) {
        if (isNewGame) {
          console.log('📋 Initializing new local game board');
          setBoard({});
          setWinningLine(null);
          setLastMove(null);
        }
        // Always sync currentPlayer for local games
        setCurrentPlayer(game.currentPlayer || 'X');
        // Don't overwrite board state for local games with existing moves
      } else {
        // For online games, always sync with server state
        console.log('📋 Syncing online game board to:', gameBoard);
        setBoard(gameBoard);
        setCurrentPlayer(game.currentPlayer || 'X');
        if (game.lastMove) {
          setLastMove(game.lastMove);
        }
      }
    }
  }, [game?.id, game?.board, game?.currentPlayer, game?.timestamp, game?.syncTimestamp]); // Include syncTimestamp for better WebSocket sync

  // Remove WebSocket handling from GameBoard - it's now handled in Home component
  // This prevents double handling and state conflicts

  // Handle incoming WebSocket messages for chat
  useEffect(() => {
    if (lastMessage?.type === 'player_chat') {
      console.log('💬 Received player chat:', lastMessage);
      console.log('💬 Current game ID:', game?.id);
      console.log('💬 Current room ID:', game?.roomId);
      console.log('💬 Message game ID:', lastMessage.gameId);
      console.log('💬 Message room ID:', lastMessage.roomId);
      console.log('💬 Message text:', lastMessage.messageText);
      console.log('💬 Player symbol:', lastMessage.playerSymbol);
      
      if (lastMessage.gameId === game?.id || lastMessage.roomId === game?.roomId) {
        const messageText = lastMessage.messageText;
        const playerSymbol = lastMessage.playerSymbol;
        
        console.log('💬 Message matches current game/room, displaying message');
        
        // Show the message for the specified player
        if (messageText) {
          setPlayerMessage(playerSymbol, messageText);
          console.log('💬 Set player message:', playerSymbol, messageText);
        }
      } else {
        console.log('💬 Message does not match current game/room, ignoring');
      }
    }
  }, [lastMessage, game?.id, game?.roomId]);

  // Debug effect to track board state changes
  useEffect(() => {
    console.log('🔄 Board state changed:', board);
    console.log('🔄 Board keys:', Object.keys(board));
    console.log('🔄 Board values:', Object.values(board));
    console.log('🔄 Game ID:', game?.id);
    console.log('🔄 Game mode:', gameMode);
  }, [board]);

  const makeMoveMutation = useMutation({
    mutationFn: async (position: number) => {
      if (!game) {
        throw new Error('No active game');
      }
      
      // For local games (AI and pass-play), handle moves locally
      if (game.id.startsWith('local-game')) {
        return handleLocalMove(position);
      }
      
      console.log('🎯 Making move with game ID:', game.id);
      console.log('🎯 Current game state:', game);
      console.log('🎯 Game status:', game.status);
      console.log('🎯 Game board:', game.board);
      
      // Additional safety check - ensure we have the latest game state
      if (game.status === 'finished') {
        console.log('❌ Attempting to move on finished game:', game.id);
        throw new Error('Game is finished');
      }
      
      return await apiRequest('POST', `/api/games/${game.id}/moves`, { position });
    },
    onSuccess: (data) => {
      console.log('🎯 Move mutation success:', data);
      if (game && !game.id.startsWith('local-game')) {
        // For online games, the Home component will handle WebSocket updates
        // No need to update local state here
        console.log('✅ Move successful, WebSocket will handle board update');
        

      }
      // For online games, don't force board update since WebSocket handles it
      // For local games, board is already updated in handleLocalMove
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
    
    console.log('🎮 HandleLocalMove called:');
    console.log('  - Position:', position);
    console.log('  - Current player:', currentPlayer);
    console.log('  - Current board:', board);
    
    // Sound effects removed as requested
    const newBoard = { ...board };
    newBoard[position.toString()] = currentPlayer;
    setLastMove(position);
    
    console.log('  - New board after move:', newBoard);
    
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
    
    // Update board state and force render
    console.log('🎮 LocalMove: Updating board from', board, 'to', newBoard);
    setBoard(newBoard);
    
    if (checkWin(newBoard, currentPlayer)) {
      const winnerInfo = currentPlayer === 'X' 
        ? (game?.playerXInfo?.firstName || game?.playerXInfo?.displayName || game?.playerXInfo?.username || 'Player X')
        : (game?.playerOInfo?.firstName || game?.playerOInfo?.displayName || game?.playerOInfo?.username || (gameMode === 'ai' ? 'AI' : 'Player O'));
      
      // Show winning positions before game over
      const winningPositions = getWinningPositions(newBoard, currentPlayer);
      if (winningPositions.length > 0) {
        setWinningLine(winningPositions);
      }
      
      // Add delay before showing game over for AI and pass-play
      setTimeout(() => {
        try {
          if (onGameOver) {
            const winnerName = currentPlayer === 'X' ? 'Player X' : (gameMode === 'ai' ? 'AI' : 'Player O');
            console.log('🎮 GameBoard sending win result:', {
              winner: currentPlayer,
              winnerName,
              condition: 'diagonal'
            });
            onGameOver({
              winner: currentPlayer,
              winnerName,
              condition: 'diagonal'
            });
          }
        } catch (error) {
          console.error('🚨 Error in game over handler:', error);
        }
      }, gameMode === 'ai' || gameMode === 'pass-play' ? 2500 : 0);
      return;
    }
    
    if (checkDraw(newBoard)) {
      if (onGameOver) {
        try {
          console.log('🎮 GameBoard sending draw result:', {
            winner: null,
            winnerName: null,
            condition: 'draw'
          });
          onGameOver({
            winner: null,
            winnerName: null,
            condition: 'draw'
          });
        } catch (error) {
          console.error('🚨 Error in draw handler:', error);
        }
      }
      return;
    }
    
    // Switch player
    const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';
    setCurrentPlayer(nextPlayer);
    

    
    // Handle AI move
    if (gameMode === 'ai' && nextPlayer === 'O') {

      setTimeout(() => {
        makeAIMove(newBoard);
      }, 1000); // Increased delay to reduce blinking
    }
  };

  const makeAIMove = (currentBoard: Record<string, string>) => {
    const availableMoves = VALID_POSITIONS.filter(pos => !currentBoard[pos.toString()]);
    if (availableMoves.length === 0) return;
    
    // AI difficulty-based move selection
    const difficulty = game?.aiDifficulty || 'medium';
    let selectedMove;
    
    if (difficulty === 'easy') {
      // Easy: Random move
      selectedMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    } else if (difficulty === 'medium') {
      // Medium: Try to win or block, otherwise random
      selectedMove = findBestMove(currentBoard, availableMoves) || availableMoves[Math.floor(Math.random() * availableMoves.length)];
    } else {
      // Hard: More strategic play
      selectedMove = findBestMoveHard(currentBoard, availableMoves) || availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
    
    // Sound effects removed as requested
    const newBoard = { ...currentBoard };
    newBoard[selectedMove.toString()] = 'O';
    
    console.log('🎮 AI Move: Updating board from', currentBoard, 'to', newBoard);
    setBoard(newBoard);
    setLastMove(selectedMove);
    

    
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
      
      // Show winning positions before game over
      const winningPositions = getWinningPositions(newBoard, 'O');
      if (winningPositions.length > 0) {
        setWinningLine(winningPositions);
      }
      
      // Add delay before showing game over for AI mode
      setTimeout(() => {
        if (onGameOver) {
          try {
            console.log('🎮 GameBoard sending AI win result:', {
              winner: 'O',
              winnerName: 'AI',
              condition: 'diagonal'
            });
            onGameOver({
              winner: 'O',
              winnerName: 'AI',
              condition: 'diagonal'
            });
          } catch (error) {
            console.error('🚨 Error in AI win handler:', error);
          }
        }
      }, 2500);
      return;
    }
    
    if (checkDraw(newBoard)) {

      
      if (onGameOver) {
        try {
          onGameOver({
            winner: null,
            winnerName: null,
            condition: 'draw'
          });
        } catch (error) {
          console.error('🚨 Error in AI draw handler:', error);
        }
      }
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
    // Sound effects removed as requested
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
          w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 ${theme.cellStyle} rounded-lg flex items-center justify-center cursor-pointer 
          ${isEmpty ? theme.cellHoverStyle : 'cursor-not-allowed'}
          ${makeMoveMutation.isPending ? 'opacity-50' : ''}
          ${isWinningCell ? theme.winningCellStyle : ''}
          ${isLastMove ? 'ring-2 ring-yellow-400' : ''}
          ${!isEmpty && !isWinningCell && symbol === 'X' ? 'animate-pulse-border-x' : ''}
          ${!isEmpty && !isWinningCell && symbol === 'O' ? 'animate-pulse-border-o' : ''}
        `}
        onClick={() => handleCellClick(position)}
        animate={isWinningCell ? {
          scale: [1, 1.05, 1.1, 1.05, 1],
          backgroundColor: [
            'rgb(51, 65, 85)', // slate-700
            'rgb(34, 197, 94)', // green-500
            'rgb(16, 185, 129)', // emerald-500
            'rgb(34, 197, 94)', // green-500
            'rgb(51, 65, 85)'  // slate-700
          ],
          boxShadow: [
            '0 0 0 rgba(34, 197, 94, 0)',
            '0 0 30px rgba(34, 197, 94, 0.8)',
            '0 0 40px rgba(16, 185, 129, 0.9)',
            '0 0 30px rgba(34, 197, 94, 0.8)',
            '0 0 0 rgba(34, 197, 94, 0)'
          ],
          borderColor: [
            'transparent',
            'rgb(34, 197, 94)',
            'rgb(16, 185, 129)',
            'rgb(34, 197, 94)',
            'transparent'
          ]
        } : {}}
        transition={isWinningCell ? {
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}
      >
        {symbol && (
          <span
            className={`text-lg sm:text-xl md:text-2xl font-bold ${
              symbol === 'X' ? theme.playerXColor : theme.playerOColor
            }`}
          >
            {symbol}
          </span>
        )}
        <span className={`text-xs ${theme.textColor} opacity-50 absolute mt-8 sm:mt-10 md:mt-12`}>{position}</span>
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

  const theme = themes[currentTheme];
  
  return (
    <Card className={`${theme.boardStyle}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className={`text-2xl ${theme.textColor}`}>Game Board</CardTitle>
          <div className="flex flex-col space-y-3 text-right">
            {/* Player X - Top */}
            <div className="flex items-center justify-end space-x-2">
              {/* Chat Message for Player X */}
              <AnimatePresence>
                {playerXMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      scale: [1, 1.05, 1], 
                      y: 0
                    }}
                    exit={{ opacity: 0, scale: 0.5, y: -20 }}
                    transition={{ 
                      duration: 0.4,
                      scale: { duration: 0.6, ease: "easeInOut" }
                    }}
                    className="relative max-w-32"
                    title={playerXMessage.text}
                  >
                    <motion.div 
                      className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-md shadow-sm"
                      animate={{ 
                        scale: [1, 1.02, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {playerXMessage.text}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex flex-col items-end">
                {hasLegendAchievement(game?.playerXInfo?.achievements) ? (
                  <motion.div
                    animate={{
                      boxShadow: [
                        "0 0 8px #ff4500, 0 0 16px #ff6600, 0 0 24px #ff8800",
                        "0 0 12px #ff0000, 0 0 24px #ff3300, 0 0 36px #ff6600",
                        "0 0 8px #ff8800, 0 0 16px #ffaa00, 0 0 24px #ffcc00",
                        "0 0 10px #ff4500, 0 0 20px #ff6600, 0 0 30px #ff8800"
                      ]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="px-2 py-1 rounded-md border-2 border-orange-500"
                  >
                    <span className={`text-sm ${theme.textColor} max-w-24 truncate font-bold`}>
                      {gameMode === 'online' 
                        ? (game?.playerXInfo?.firstName || game?.playerXInfo?.displayName || game?.playerXInfo?.username || 'Player X')
                        : 'Player X'}
                    </span>
                  </motion.div>
                ) : (
                  <span className={`text-sm ${theme.textColor} max-w-24 truncate`}>
                    {gameMode === 'online' 
                      ? (game?.playerXInfo?.firstName || game?.playerXInfo?.displayName || game?.playerXInfo?.username || 'Player X')
                      : 'Player X'}
                  </span>
                )}
                {gameMode === 'online' && game?.playerXInfo?.achievements && game.playerXInfo.achievements.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {/* Show only the most recent achievement (latest badge replaces old one) */}
                    {game.playerXInfo.achievements.slice(-1).map((achievement: any) => (
                      <span
                        key={achievement.id}
                        className="text-xs text-gray-700 dark:text-gray-300 px-1 py-0.5"
                        title={achievement.description}
                      >
                        {achievement.icon}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {gameMode === 'online' && (game?.playerXInfo?.profileImageUrl || game?.playerXInfo?.profilePicture) ? (
                <img 
                  src={game.playerXInfo.profileImageUrl || game.playerXInfo.profilePicture} 
                  alt="Player X" 
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">X</span>
                </div>
              )}
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
            
            {/* Player O - Bottom */}
            <div className="flex items-center justify-end space-x-2">
              {/* Chat Message for Player O */}
              <AnimatePresence>
                {playerOMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      scale: [1, 1.05, 1], 
                      y: 0
                    }}
                    exit={{ opacity: 0, scale: 0.5, y: -20 }}
                    transition={{ 
                      duration: 0.4,
                      scale: { duration: 0.6, ease: "easeInOut" }
                    }}
                    className="relative max-w-32"
                    title={playerOMessage.text}
                  >
                    <motion.div 
                      className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-md shadow-sm"
                      animate={{ 
                        scale: [1, 1.02, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {playerOMessage.text}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex flex-col items-end">
                {hasLegendAchievement(game?.playerOInfo?.achievements) ? (
                  <motion.div
                    animate={{
                      boxShadow: [
                        "0 0 8px #ff4500, 0 0 16px #ff6600, 0 0 24px #ff8800",
                        "0 0 12px #ff0000, 0 0 24px #ff3300, 0 0 36px #ff6600",
                        "0 0 8px #ff8800, 0 0 16px #ffaa00, 0 0 24px #ffcc00",
                        "0 0 10px #ff4500, 0 0 20px #ff6600, 0 0 30px #ff8800"
                      ]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="px-2 py-1 rounded-md border-2 border-orange-500"
                  >
                    <span className={`text-sm ${theme.textColor} max-w-24 truncate font-bold`}>
                      {gameMode === 'online' 
                        ? (game?.playerOInfo?.firstName || game?.playerOInfo?.displayName || game?.playerOInfo?.username || 'Player O')
                        : (gameMode === 'ai' ? 'AI' : 'Player O')}
                    </span>
                  </motion.div>
                ) : (
                  <span className={`text-sm ${theme.textColor} max-w-24 truncate`}>
                    {gameMode === 'online' 
                      ? (game?.playerOInfo?.firstName || game?.playerOInfo?.displayName || game?.playerOInfo?.username || 'Player O')
                      : (gameMode === 'ai' ? 'AI' : 'Player O')}
                  </span>
                )}
                {gameMode === 'online' && game?.playerOInfo?.achievements && game.playerOInfo.achievements.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {/* Show only the most recent achievement (latest badge replaces old one) */}
                    {game.playerOInfo.achievements.slice(-1).map((achievement: any) => (
                      <span
                        key={achievement.id}
                        className="text-xs text-gray-700 dark:text-gray-300 px-1 py-0.5"
                        title={achievement.description}
                      >
                        {achievement.icon}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {gameMode === 'online' && (game?.playerOInfo?.profileImageUrl || game?.playerOInfo?.profilePicture) ? (
                <img 
                  src={game.playerOInfo.profileImageUrl || game.playerOInfo.profilePicture} 
                  alt="Player O" 
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">O</span>
                </div>
              )}
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Current Player Indicator */}
        <div className={`mb-6 p-4 ${theme.cellStyle.split(' ')[0]} ${theme.borderColor} border rounded-lg`}>
          <div className="flex items-center justify-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${
              currentPlayer === 'X' ? 'bg-blue-500' : 'bg-red-500'
            }`}></div>
            <span className={`text-lg font-medium ${theme.textColor}`}>
              {gameMode === 'online' 
                ? (currentPlayer === 'X' 
                    ? (game?.playerXInfo?.firstName || game?.playerXInfo?.displayName || game?.playerXInfo?.username || 'Player X')
                    : (game?.playerOInfo?.firstName || game?.playerOInfo?.displayName || game?.playerOInfo?.username || 'Player O'))
                : (currentPlayer === 'X' 
                    ? 'Player X'
                    : (gameMode === 'ai' ? 'AI' : 'Player O'))
              }'s Turn
            </span>
          </div>
        </div>

        {/* 3x5 Game Grid */}
        <div 
          key={`board-${JSON.stringify(board)}`}
          className="relative grid grid-cols-5 gap-2 sm:gap-3 md:gap-4 max-w-xs sm:max-w-md md:max-w-lg mx-auto"
        >
          {/* Row 1: 1,2,3,4,5 */}
          {[1, 2, 3, 4, 5].map(renderCell)}
          
          {/* Row 2: 6,7,8,9,10 */}
          {[6, 7, 8, 9, 10].map(renderCell)}
          
          {/* Row 3: 11,12,13,14,15 */}
          {[11, 12, 13, 14, 15].map(renderCell)}
          
          {/* Winning line animation removed - keeping only box blink */}
        </div>

        {/* Game Controls */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button 
            variant="outline"
            onClick={() => setShowChatPanel(!showChatPanel)}
            className="flex items-center space-x-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat</span>
          </Button>
          
          {/* Only show Reset Game button for non-online modes */}
          {gameMode !== 'online' && (
            <Button 
              variant="destructive"
              onClick={resetGame}
              disabled={makeMoveMutation.isPending}
            >
              Reset Game
            </Button>
          )}
        </div>
        
        {/* Quick Chat Panel */}
        <div className="relative">
          <QuickChatPanel
            isOpen={showChatPanel}
            onMessageClick={handleMessageClick}
            onClose={() => setShowChatPanel(false)}
          />
        </div>
      </CardContent>

    </Card>
  );
}
