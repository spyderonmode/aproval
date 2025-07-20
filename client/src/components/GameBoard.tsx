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
import { useTranslation } from "@/contexts/LanguageContext";
import { GameExpirationTimer } from '@/components/GameExpirationTimer';
import { PlayerProfileModal } from '@/components/PlayerProfileModal';

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

// Helper function to check if player has Champion achievement (100 wins)
const hasChampionAchievement = (achievements: any[]): boolean => {
  return achievements?.some(achievement => achievement.achievementType === 'champion') || false;
};

// Helper function to check if player has Grandmaster achievement (200 wins)
const hasGrandmasterAchievement = (achievements: any[]): boolean => {
  return achievements?.some(achievement => achievement.achievementType === 'grandmaster') || false;
};

// Helper function to check if player has Ultimate Veteran achievement (500 games)
const hasUltimateVeteranAchievement = (achievements: any[]): boolean => {
  return achievements?.some(achievement => achievement.achievementType === 'ultimate_veteran') || false;
};

// Helper function to get the selected achievement border for display
const getSelectedAchievementBorder = (playerInfo: any): string | null => {
  // If player has selectedAchievementBorder, use that (including null for no border)
  if (playerInfo?.selectedAchievementBorder !== undefined) {
    return playerInfo.selectedAchievementBorder;
  }
  
  // Fallback to auto-detection of highest achievement for legacy users
  const achievements = playerInfo?.achievements || [];
  if (hasUltimateVeteranAchievement(achievements)) return 'ultimate_veteran';
  if (hasGrandmasterAchievement(achievements)) return 'grandmaster';
  if (hasChampionAchievement(achievements)) return 'champion';
  if (hasLegendAchievement(achievements)) return 'legend';
  
  return null; // No border
};

// Helper function to render achievement borders based on selected type
const renderAchievementBorder = (borderType: string | null, playerName: string, theme: any) => {
  switch (borderType) {
    case 'ultimate_veteran':
      return (
        <motion.div
          animate={{
            boxShadow: [
              "0 0 15px #ff6347, 0 0 30px #ff4500, 0 0 45px #ff8c00, 0 0 60px #ffd700, 0 0 75px #ff6347",
              "0 0 20px #ff1493, 0 0 40px #dc143c, 0 0 60px #b22222, 0 0 80px #8b0000, 0 0 100px #ff1493",
              "0 0 18px #ff6600, 0 0 36px #ff3300, 0 0 54px #ff0000, 0 0 72px #cc0000, 0 0 90px #ff6600",
              "0 0 25px #ffa500, 0 0 50px #ff8c00, 0 0 75px #ff7f50, 0 0 100px #ff6347, 0 0 125px #ffa500"
            ],
            scale: [1, 1.05, 1.03, 1.07, 1],
            rotate: [0, 2, -1, 3, 0],
            filter: [
              "brightness(1) saturate(1)",
              "brightness(1.2) saturate(1.3)",
              "brightness(1.1) saturate(1.1)",
              "brightness(1.3) saturate(1.4)",
              "brightness(1) saturate(1)"
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="px-2 py-1 rounded-lg border-3 border-double border-orange-600 bg-gradient-to-r from-red-900/30 via-orange-800/30 to-red-900/30 relative overflow-hidden"
          style={{
            background: "linear-gradient(45deg, rgba(255, 69, 0, 0.2), rgba(255, 140, 0, 0.15), rgba(255, 99, 71, 0.2), rgba(255, 165, 0, 0.15))",
            backgroundSize: "400% 400%",
            animation: "gradient-shift 3s ease infinite"
          }}
        >
          <motion.span 
            className={`text-sm ${theme.textColor} max-w-24 truncate font-black relative z-10`}
            animate={{
              textShadow: [
                "0 0 8px #ff6347, 0 0 12px #ff4500, 0 0 16px #ffd700",
                "0 0 10px #ff1493, 0 0 15px #dc143c, 0 0 20px #8b0000",
                "0 0 9px #ff6600, 0 0 13px #ff3300, 0 0 17px #cc0000",
                "0 0 12px #ffa500, 0 0 18px #ff8c00, 0 0 24px #ff7f50"
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {playerName}
          </motion.span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/20 to-transparent animate-shimmer"></div>
        </motion.div>
      );
    case 'grandmaster':
      return (
        <motion.div
          animate={{
            boxShadow: [
              "0 0 12px #e0e7ff, 0 0 24px #c7d2fe, 0 0 36px #a5b4fc, 0 0 48px #818cf8",
              "0 0 16px #f3f4f6, 0 0 32px #e5e7eb, 0 0 48px #d1d5db, 0 0 64px #9ca3af",
              "0 0 14px #ddd6fe, 0 0 28px #c4b5fd, 0 0 42px #a78bfa, 0 0 56px #8b5cf6",
              "0 0 18px #fef3c7, 0 0 36px #fde68a, 0 0 54px #fcd34d, 0 0 72px #f59e0b"
            ],
            scale: [1, 1.03, 1.01, 1.04, 1],
            rotate: [0, 1, -0.5, 1.5, 0]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="px-2 py-1 rounded-lg border-2 border-indigo-400 bg-gradient-to-r from-indigo-900/25 via-gray-800/25 to-indigo-900/25 relative"
          style={{
            background: "linear-gradient(45deg, rgba(99, 102, 241, 0.15), rgba(156, 163, 175, 0.1), rgba(139, 92, 246, 0.15), rgba(245, 158, 11, 0.1))",
            backgroundSize: "300% 300%",
          }}
        >
          <motion.span 
            className={`text-sm ${theme.textColor} max-w-24 truncate font-bold`}
            animate={{
              textShadow: [
                "0 0 6px #818cf8",
                "0 0 8px #9ca3af",
                "0 0 7px #8b5cf6",
                "0 0 9px #f59e0b"
              ]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {playerName}
          </motion.span>
        </motion.div>
      );
    case 'champion':
      return (
        <motion.div
          animate={{
            boxShadow: [
              "0 0 10px #8a2be2, 0 0 20px #4b0082, 0 0 30px #9932cc, 0 0 40px #8a2be2",
              "0 0 15px #00bfff, 0 0 30px #1e90ff, 0 0 45px #4169e1, 0 0 60px #00bfff",
              "0 0 12px #ffd700, 0 0 24px #ffff00, 0 0 36px #ffa500, 0 0 48px #ffd700",
              "0 0 18px #ff69b4, 0 0 36px #ff1493, 0 0 54px #dc143c, 0 0 72px #ff69b4",
              "0 0 10px #8a2be2, 0 0 20px #4b0082, 0 0 30px #9932cc, 0 0 40px #8a2be2"
            ],
            scale: [1, 1.02, 1, 1.01, 1],
            rotate: [0, 1, 0, -1, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="px-2 py-1 rounded-lg border-2 border-purple-500 bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-purple-900/20"
          style={{
            background: "linear-gradient(45deg, rgba(138, 43, 226, 0.1), rgba(30, 144, 255, 0.1), rgba(255, 105, 180, 0.1), rgba(138, 43, 226, 0.1))",
            backgroundSize: "300% 300%",
          }}
        >
          <motion.span 
            className={`text-sm ${theme.textColor} max-w-24 truncate font-bold`}
            animate={{
              textShadow: [
                "0 0 5px #8a2be2",
                "0 0 10px #00bfff",
                "0 0 5px #ffd700",
                "0 0 10px #ff69b4",
                "0 0 5px #8a2be2"
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {playerName}
          </motion.span>
        </motion.div>
      );
    case 'legend':
      return (
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
            {playerName}
          </span>
        </motion.div>
      );
    default:
      return (
        <span className={`text-sm ${theme.textColor} max-w-24 truncate`}>
          {playerName}
        </span>
      );
  }
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
  
  // Profile modal state
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Handle profile picture click
  const handleProfileClick = (playerId: string) => {
    console.log('🎮 Profile click handler called with playerId:', playerId);
    console.log('🎮 Current showProfileModal state:', showProfileModal);
    console.log('🎮 Current selectedPlayerId state:', selectedPlayerId);
    console.log('🎮 Setting selectedPlayerId and showProfileModal to true');
    
    // Force close first if already open, then open with new player
    if (showProfileModal) {
      setShowProfileModal(false);
      setSelectedPlayerId(null);
      // Use setTimeout to ensure state is updated before opening with new player
      setTimeout(() => {
        setSelectedPlayerId(playerId);
        setShowProfileModal(true);
        console.log('🎮 Modal reopened with playerId:', playerId);
      }, 100);
    } else {
      setSelectedPlayerId(playerId);
      setShowProfileModal(true);
      console.log('🎮 Modal opened with playerId:', playerId);
    }
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedPlayerId(null);
  };
  
  // Update winning line when game has winning positions
  useEffect(() => {
    if (game?.winningPositions) {
      setWinningLine(game.winningPositions);
    }
  }, [game?.winningPositions]);

  // Auto-close profile modal when game ends  
  useEffect(() => {
    if (game?.status === 'finished' || game?.status === 'abandoned') {
      if (showProfileModal) {
        console.log('🎮 Auto-closing profile modal due to game end');
        setShowProfileModal(false);
        setSelectedPlayerId(null);
      }
    }
  }, [game?.status, showProfileModal]);

  // Debug effect to track modal state changes
  useEffect(() => {
    console.log('🎮 Modal state changed - showProfileModal:', showProfileModal, 'selectedPlayerId:', selectedPlayerId);
  }, [showProfileModal, selectedPlayerId]);
  const { toast } = useToast();
  const { currentTheme, themes } = useTheme();
  const { t } = useTranslation();
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
      
      return await apiRequest(`/api/games/${game.id}/moves`, { method: 'POST', body: { position } });
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
        title: t('invalidMove'),
        description: t('positionOccupied'),
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
          title: t('notAPlayer'),
          description: t('notPlayerInGame'),
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
          title: t('notYourTurn'),
          description: `${t('waitingFor')} ${currentPlayerName} ${t('toMakeMove')}`,
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
          <div className="flex flex-col space-y-2">
            <CardTitle className={`text-2xl ${theme.textColor}`}>{t('gameBoard')}</CardTitle>
            {/* Only show timer for online games */}
            {gameMode === 'online' && game?.lastMoveAt && (
              <GameExpirationTimer 
                lastMoveAt={game.lastMoveAt}
                createdAt={game.createdAt || new Date()}
                onExpired={() => {
                  console.log('⏰ Game expired in GameBoard component');
                  // The actual expiration handling is done by server, this is just for UI feedback
                }}
              />
            )}
          </div>
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
                {renderAchievementBorder(
                  getSelectedAchievementBorder(game?.playerXInfo),
                  gameMode === 'online' 
                    ? (game?.playerXInfo?.firstName || game?.playerXInfo?.displayName || game?.playerXInfo?.username || 'Player X')
                    : 'Player X',
                  theme
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
              {(gameMode === 'online' && (game?.playerXInfo?.profileImageUrl || game?.playerXInfo?.profilePicture)) ? (
                <img 
                  src={game.playerXInfo.profileImageUrl || game.playerXInfo.profilePicture} 
                  alt="Player X" 
                  className="w-6 h-6 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all duration-200 hover:scale-110 relative z-50"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🎮 Player X profile clicked:', game.playerXInfo.id);
                    console.log('🎮 Current modal states:', { showProfileModal, selectedPlayerId });
                    console.log('🎮 Game state:', game?.status);
                    handleProfileClick(game.playerXInfo.id);
                  }}
                  title="Click to view player profile"
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
                {renderAchievementBorder(
                  getSelectedAchievementBorder(game?.playerOInfo),
                  gameMode === 'online' 
                    ? (game?.playerOInfo?.firstName || game?.playerOInfo?.displayName || game?.playerOInfo?.username || 'Player O')
                    : (gameMode === 'ai' ? 'AI' : 'Player O'),
                  theme
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
              {(gameMode === 'online' && (game?.playerOInfo?.profileImageUrl || game?.playerOInfo?.profilePicture)) ? (
                <img 
                  src={game.playerOInfo.profileImageUrl || game.playerOInfo.profilePicture} 
                  alt="Player O" 
                  className="w-6 h-6 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-red-400 transition-all duration-200 hover:scale-110 relative z-50"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🎮 Player O profile clicked:', game.playerOInfo.id);
                    console.log('🎮 Current modal states:', { showProfileModal, selectedPlayerId });
                    console.log('🎮 Game state:', game?.status);
                    handleProfileClick(game.playerOInfo.id);
                  }}
                  title="Click to view player profile"
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
            <span>{t('chat')}</span>
          </Button>
          
          {/* Only show Reset Game button for non-online modes */}
          {gameMode !== 'online' && (
            <Button 
              variant="destructive"
              onClick={resetGame}
              disabled={makeMoveMutation.isPending}
            >
              {t('resetGame')}
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

      {/* Player Profile Modal */}
      <PlayerProfileModal
        playerId={selectedPlayerId}
        open={showProfileModal}
        onClose={handleCloseProfileModal}
        currentUserId={user?.userId || user?.id}
      />

    </Card>
  );
}
