import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
// useAudio hook removed as sound effects are removed
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { GameBoard } from "@/components/GameBoard";
import { GameModeSelector } from "@/components/GameModeSelector";
import { ProfileManager } from "@/components/ProfileManager";
// AudioControls component removed as requested
import { RoomManager } from "@/components/RoomManager";
import { PlayerList } from "@/components/PlayerList";
import { CreateRoomModal } from "@/components/CreateRoomModal";
import { GameOverModal } from "@/components/GameOverModal";
import { EmailVerificationModal } from "@/components/EmailVerificationModal";
import { MatchmakingModal } from "@/components/MatchmakingModal";
import { OnlineUsersModal } from "@/components/OnlineUsersModal";
import { ThemeSelector } from "@/components/ThemeSelector";
import { AchievementModal } from "@/components/AchievementModal";
import { Friends } from "@/components/Friends";
import { InvitationPopup } from "@/components/InvitationPopup";
import { Leaderboard } from "@/components/Leaderboard";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GamepadIcon, LogOut, User, Zap, Loader2, Users, Settings, Menu, X, Palette, Trophy, Languages } from "lucide-react";
import { logout } from "@/lib/firebase";
import { useTranslation } from "@/contexts/LanguageContext";
import { CustomLanguageSelector } from "@/components/CustomLanguageSelector";

export default function Home() {
  const { user } = useAuth();
  const { isConnected, lastMessage, joinRoom, leaveRoom, sendMessage } = useWebSocket();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  // Sound effects removed as requested
  const [selectedMode, setSelectedMode] = useState<'ai' | 'pass-play' | 'online'>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showMatchmaking, setShowMatchmaking] = useState(false);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [onlineUserCount, setOnlineUserCount] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [showHeaderSidebar, setShowHeaderSidebar] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const headerSidebarRef = useRef<HTMLDivElement>(null);

  const { data: userStats } = useQuery({
    queryKey: ["/api/users/online-stats"],
    enabled: !!user,
  });

  // Check if email verification is required
  useEffect(() => {
    if (user && user.email && !user.isEmailVerified) {
      setShowEmailVerification(true);
    }
  }, [user]);

  // Close header sidebar when clicking outside or via custom event
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerSidebarRef.current && !headerSidebarRef.current.contains(event.target as Node)) {
        // Check if the click is on a theme selector dialog or any other modal
        const target = event.target as Element;
        if (target.closest('[data-radix-portal]') || 
            target.closest('[role="dialog"]') ||
            target.closest('[data-state="open"]')) {
          return; // Don't close sidebar if clicking on a dialog or modal
        }
        setShowHeaderSidebar(false);
      }
    };

    const handleCloseHeaderSidebar = () => {
      setShowHeaderSidebar(false);
    };

    if (showHeaderSidebar) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('closeHeaderSidebar', handleCloseHeaderSidebar);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('closeHeaderSidebar', handleCloseHeaderSidebar);
      };
    }
  }, [showHeaderSidebar]);

  // Listen for leaderboard open events
  useEffect(() => {
    const handleOpenLeaderboard = () => {
      setShowLeaderboard(true);
    };

    window.addEventListener('openLeaderboard', handleOpenLeaderboard);
    return () => window.removeEventListener('openLeaderboard', handleOpenLeaderboard);
  }, []);

  useEffect(() => {
    if (lastMessage) {
      console.log('🎮 Home received WebSocket message:', lastMessage);
      switch (lastMessage.type) {
        case 'online_users_update':
          setOnlineUserCount(lastMessage.count);
          break;
        case 'chat_message_received':
          // Event is already dispatched by useWebSocket hook, no need to dispatch again
          break;
        case 'user_offline':
          // Dispatch custom event for chat history cleanup
          window.dispatchEvent(new CustomEvent('user_offline', {
            detail: lastMessage
          }));
          break;
        case 'game_started':
          console.log('🎮 Processing game_started message:', lastMessage);
          console.log('🎮 Current room ID:', currentRoom?.id);
          console.log('🎮 Message room ID:', lastMessage.roomId);
          console.log('🎮 Game data:', lastMessage.game);
          console.log('🎮 Current user ID:', user?.userId || user?.id);
          // Handle game start from WebSocket - ensure both players transition
          if (lastMessage.roomId === currentRoom?.id || !currentRoom) {
            console.log('🎮 Setting current game from WebSocket:', lastMessage.game);
            console.log('🎮 New game ID:', lastMessage.game.id);
            console.log('🎮 Previous game ID:', currentGame?.id);
            console.log('🎮 Game status:', lastMessage.game.status);
            console.log('🎮 Game board:', lastMessage.game.board);
            console.log('🎮 Player X ID:', lastMessage.game.playerXId);
            console.log('🎮 Player O ID:', lastMessage.game.playerOId);
            console.log('🎮 Current player:', lastMessage.game.currentPlayer);
            
            // Ensure game mode is set to online when receiving game_started
            console.log('🎮 Setting selectedMode to online for game_started');
            setSelectedMode('online');
            
            // Set the room if not already set (for bot matches)
            if (!currentRoom && lastMessage.roomId) {
              console.log('🎮 Setting room from game_started message');
              setCurrentRoom({ id: lastMessage.roomId, status: 'playing' });
            }
            
            // Update room status to playing to sync with backend
            if (currentRoom) {
              setCurrentRoom(prevRoom => ({
                ...prevRoom,
                status: 'playing'
              }));
              console.log('🎮 Updated room status to playing');
            }
            
            // Force complete state update to ensure game appears
            setCurrentGame(prevGame => {
              console.log('🎮 Game state update - prev:', prevGame, 'new:', lastMessage.game);
              console.log('🎮 Game mode from message:', lastMessage.game.gameMode);
              console.log('🎮 Board from message:', lastMessage.game.board);
              console.log('🎮 Current player from message:', lastMessage.game.currentPlayer);
              // Use the actual game state from the message, don't reset it
              const newGame = {
                ...lastMessage.game,
                status: 'active',
                gameMode: lastMessage.game.gameMode || 'online', // Ensure game mode is set
                // Keep the actual board state and current player from the server
                board: lastMessage.game.board || {},
                currentPlayer: lastMessage.game.currentPlayer || 'X',
                timestamp: Date.now() // Force re-render
              };
              console.log('🎮 Final game object being set:', newGame);
              console.log('🎮 Final game mode:', newGame.gameMode);
              console.log('🎮 Final board state:', newGame.board);
              return newGame;
            });
            // Reset creating state since game was successfully created
            setIsCreatingGame(false);
            // Also reset game over state if it was showing
            setShowGameOver(false);
            setGameResult(null);
            
            // Invalidate room participants query to refresh room data
            queryClient.invalidateQueries({ queryKey: ['room-participants', currentRoom?.id] });
          }
          break;
        case 'move':
          // Handle move updates from WebSocket - FOR BOTH PLAYERS AND SPECTATORS
          if (currentGame && lastMessage.gameId === currentGame.id) {
            console.log('🎮 Home received move WebSocket message:', lastMessage);
            console.log('🎮 Updating game board from:', currentGame.board, 'to:', lastMessage.board);
            console.log('🎮 Current player changing from:', currentGame.currentPlayer, 'to:', lastMessage.currentPlayer);
            
            // Update the current game state immediately for everyone (players and spectators)
            setCurrentGame(prevGame => {
              const updatedGame = {
                ...prevGame,
                board: lastMessage.board,
                currentPlayer: lastMessage.currentPlayer,
                lastMove: lastMessage.position,
                playerXInfo: lastMessage.playerXInfo || prevGame.playerXInfo,
                playerOInfo: lastMessage.playerOInfo || prevGame.playerOInfo,
                timestamp: Date.now() // Force re-render
              };
              console.log('🎮 Updated game state after move:', updatedGame);
              return updatedGame;
            });
            
            // Force a second update to ensure React re-renders with the new state
            setTimeout(() => {
              setCurrentGame(prevGame => ({
                ...prevGame,
                syncTimestamp: Date.now()
              }));
            }, 10);
            
            // Sound effects removed as requested
          } else if (currentRoom && (lastMessage.roomId === currentRoom.id || lastMessage.gameId)) {
            // If we're in the room but don't have currentGame set, set it from the move message
            console.log('🎮 Spectator or disconnected player receiving move for room game');
            if (!currentGame) {
              // Create a basic game object for spectators/rejoining players with player info
              setCurrentGame({
                id: lastMessage.gameId,
                roomId: currentRoom.id,
                board: lastMessage.board,
                currentPlayer: lastMessage.currentPlayer,
                lastMove: lastMessage.position,
                playerXInfo: lastMessage.playerXInfo,
                playerOInfo: lastMessage.playerOInfo,
                timestamp: Date.now()
              });
            } else {
              // Update existing game state with player info
              setCurrentGame(prevGame => ({
                ...prevGame,
                board: lastMessage.board,
                currentPlayer: lastMessage.currentPlayer,
                lastMove: lastMessage.position,
                playerXInfo: lastMessage.playerXInfo || prevGame.playerXInfo,
                playerOInfo: lastMessage.playerOInfo || prevGame.playerOInfo,
                timestamp: Date.now()
              }));
            }
            // Sound effects removed as requested
          }
          break;
        case 'winning_move':
          // Handle winning move with position highlighting
          if (currentGame && lastMessage.gameId === currentGame.id) {
            console.log('🎮 Winning move received:', lastMessage);
            setCurrentGame(prevGame => ({
              ...prevGame,
              board: lastMessage.board,
              currentPlayer: lastMessage.currentPlayer,
              lastMove: lastMessage.position,
              winningPositions: lastMessage.winningPositions,
              timestamp: Date.now()
            }));
          }
          break;
        case 'game_over':
          // Handle game over from WebSocket
          if (currentGame && lastMessage.gameId === currentGame.id) {
            // Sound effects removed as requested
            const userId = user?.userId || user?.id;
            console.log('🎮 Game over message received:', lastMessage);
            console.log('🎮 Winner info from server:', lastMessage.winnerInfo);
            console.log('🎮 Player X Info:', lastMessage.playerXInfo || currentGame.playerXInfo);
            console.log('🎮 Player O Info:', lastMessage.playerOInfo || currentGame.playerOInfo);

            // Create comprehensive result object with all player info
            const gameResult = {
              winner: lastMessage.winner,
              condition: lastMessage.condition,
              board: lastMessage.board,
              winnerInfo: lastMessage.winnerInfo,
              playerXInfo: lastMessage.playerXInfo || currentGame.playerXInfo,
              playerOInfo: lastMessage.playerOInfo || currentGame.playerOInfo,
              game: {
                ...currentGame,
                gameMode: currentGame.gameMode || 'online'
              }
            };

            console.log('🎮 Setting complete game result:', gameResult);
            setGameResult(gameResult);
            setShowGameOver(true);

            // Check if this is a bot game and auto-navigate to main menu after 1 second
            const isPlayingAgainstBot = gameResult.playerXInfo?.id?.startsWith('player_') || 
                                       gameResult.playerOInfo?.id?.startsWith('player_');
            
            if (isPlayingAgainstBot) {
              console.log('🤖 Bot game ended, auto-navigating to main menu in 1 second');
              setTimeout(() => {
                console.log('🤖 Auto-navigating to main menu for bot game');
                setShowGameOver(false);
                resetToMainMenu();
              }, 1000);
            }
          }
          break;
        case 'player_left':
          // Handle player leaving room
          if (currentRoom && lastMessage.roomId === currentRoom.id) {
            console.log('🎮 Player left room:', lastMessage);
            // Show notification about player leaving
          }
          break;
        case 'room_ended':
          // Handle room ending - refresh the page
          if (currentRoom && lastMessage.roomId === currentRoom.id) {
            console.log('🎮 Room ended, refreshing page');
            toast({
              title: "Room Ended",
              description: `${lastMessage.playerName || 'A player'} left the room. Refreshing page...`,
              duration: 2000,
            });
            // Auto-refresh the page after a short delay
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
          break;
        case 'match_found':
          console.log('🎮 Match found:', lastMessage);
          if (!isMatchmaking) {
            console.log('🎮 Ignoring duplicate match_found - not in matchmaking');
            break;
          }
          setIsMatchmaking(false);
          setShowMatchmaking(false);
          // Server automatically joins players to room, set room state and join the room
          console.log('🎮 Setting room from match_found:', lastMessage.room);
          setCurrentRoom(lastMessage.room);
          setSelectedMode('online'); // Ensure we're in online mode
          
          // Join the room via WebSocket to receive game updates
          if (lastMessage.room?.id) {
            console.log('🎮 Joining room after match found:', lastMessage.room.id);
            joinRoom(lastMessage.room.id);
          }
          
          toast({
            title: "Match Found!",
            description: "You've been matched with an opponent. Game starting...",
          });
          break;
        case 'matchmaking_response':
          console.log('🎮 Matchmaking response:', lastMessage);
          if (lastMessage.status === 'matched') {
            if (!isMatchmaking) {
              console.log('🎮 Ignoring duplicate matchmaking_response - not in matchmaking');
              break;
            }
            setIsMatchmaking(false);
            setShowMatchmaking(false);
            handleRoomJoin(lastMessage.room);
            toast({
              title: "Match Found!",
              description: "You've been matched with an opponent. Game starting...",
            });
          }
          break;
        case 'matchmaking_success':
          console.log('🎮 Matchmaking success:', lastMessage);
          if (!isMatchmaking) {
            console.log('🎮 Ignoring duplicate matchmaking_success - not in matchmaking');
            break;
          }
          setIsMatchmaking(false);
          setShowMatchmaking(false);
          handleRoomJoin(lastMessage.room);
          toast({
            title: "Match Found!",
            description: lastMessage.message || "You've been matched with a real player!",
          });
          break;
        case 'reconnection_room_join':
          console.log('🔄 Reconnection room join:', lastMessage);
          if (lastMessage.room) {
            handleRoomJoin(lastMessage.room);
            toast({
              title: "Reconnected!",
              description: lastMessage.message || "You've been reconnected to your game room.",
            });
          }
          break;
        case 'game_reconnection':
          console.log('🔄 Game reconnection:', lastMessage);
          if (lastMessage.game && lastMessage.roomId === currentRoom?.id) {
            console.log('🔄 Restoring game state from reconnection:', lastMessage.game);
            setSelectedMode('online');
            setCurrentGame({
              ...lastMessage.game,
              status: 'active',
              gameMode: 'online',
              timestamp: Date.now()
            });
            setIsCreatingGame(false);
            setShowGameOver(false);
            setGameResult(null);
            toast({
              title: "Game Restored!",
              description: lastMessage.message || "Your game has been restored successfully.",
            });
          }
          break;
        case 'player_reconnected':
          console.log('🔄 Player reconnected:', lastMessage);
          if (currentRoom && lastMessage.userId !== (user?.userId || user?.id)) {
            toast({
              title: "Player Reconnected",
              description: `${lastMessage.playerName} has reconnected to the game.`,
            });
          }
          break;
        case 'game_expired':
          console.log('⏰ Game expired:', lastMessage);
          // Batch all state changes together to prevent screen blinking
          setTimeout(() => {
            // Single batched state update
            setCurrentGame(null);
            setCurrentRoom(null);
            setSelectedMode('ai');
            setShowGameOver(false);
            setGameResult(null);
            setIsCreatingGame(false);
            
            toast({
              title: "Game Expired",
              description: lastMessage.message || "Game expired due to inactivity. Returning to lobby.",
              variant: "destructive",
            });
            
            // Initialize new local game after all state is cleared
            setTimeout(() => {
              initializeLocalGame();
            }, 150);
          }, 200); // Longer delay to ensure all rendering settles
          break;
        case 'game_abandoned':
          console.log('🏠 Game abandoned - player left:', lastMessage);
          // Batch all state changes together to prevent screen blinking
          setTimeout(() => {
            // Single batched state update
            setCurrentGame(null);
            setCurrentRoom(null);
            setSelectedMode('ai');
            setShowGameOver(false);
            setGameResult(null);
            setIsCreatingGame(false);
            
            toast({
              title: "Game Ended",
              description: lastMessage.message || "Game ended because a player left the room.",
              variant: "destructive",
            });
            
            // Initialize new local game after all state is cleared
            setTimeout(() => {
              initializeLocalGame();
            }, 150);
          }, 200); // Longer delay to ensure all rendering settles
          break;
        case 'player_reaction':
          // Handle player reaction - this will be broadcast to all players and spectators
          if (currentGame && (lastMessage.gameId === currentGame.id || lastMessage.roomId === currentRoom?.id)) {
            console.log('🎮 Player reaction received:', lastMessage);
            // The reaction will be displayed by the GameBoard component
            // We don't need to handle it here as it's handled by the GameBoard component directly
          }
          break;
        case 'player_chat':
          // Handle player chat - this will be broadcast to all players and spectators
          if (currentGame && (lastMessage.gameId === currentGame.id || lastMessage.roomId === currentRoom?.id)) {
            console.log('🎮 Player chat received:', lastMessage);
            // The chat will be displayed by the GameBoard component
            // We don't need to handle it here as it's handled by the GameBoard component directly
          }
          break;
      }
    }
  }, [lastMessage, currentGame, currentRoom, user]);

  const handleRoomJoin = (room: any) => {
    console.log('🏠 handleRoomJoin called with room:', room.id);
    console.log('🏠 Current room before join:', currentRoom?.id);
    
    // Prevent duplicate room joins
    if (currentRoom && currentRoom.id === room.id) {
      console.log('🏠 Already in this room, skipping duplicate join');
      return;
    }
    
    // Automatically switch to online mode when joining a room
    console.log('🏠 Switching to online mode for room join');
    setSelectedMode('online');
    
    setCurrentRoom(room);
    joinRoom(room.id);
  };

  const handleRoomLeave = () => {
    if (currentRoom) {
      leaveRoom(currentRoom.id);
      setCurrentRoom(null);
    }
  };

  const resetToMainMenu = () => {
    console.log('🏠 resetToMainMenu called');

    // Leave room if currently in one - this will trigger room end notification
    if (currentRoom) {
      console.log('🏠 Leaving room from main menu:', currentRoom.id);
      console.log('🏠 User info:', user);
      console.log('🏠 WebSocket connected:', isConnected);

      // Send explicit leave message to notify other players FIRST
      const leaveMessage = {
        type: 'leave_room',
        roomId: currentRoom.id,
        userId: user?.userId || user?.id,
        playerName: user?.displayName || user?.firstName || user?.username || 'Player'
      };

      console.log('🏠 Sending leave message:', leaveMessage);
      sendMessage(leaveMessage);

      // Longer delay to ensure message is sent and prevent blinking
      setTimeout(() => {
        console.log('🏠 Cleaning up after leave message sent');
        // Single batched state update to prevent multiple renders
        setCurrentRoom(null);
        setCurrentGame(null);
        setShowGameOver(false);
        setGameResult(null);
        setIsCreatingGame(false);
        setSelectedMode('ai');
        
        // Initialize new local game after all state is cleared
        setTimeout(() => {
          initializeLocalGame();
        }, 150);
      }, 250); // Longer delay to prevent rapid state changes
    } else {
      console.log('🏠 No current room, just resetting state');
      // Batch state changes to prevent screen blinking
      const resetState = () => {
        setCurrentRoom(null);
        setCurrentGame(null);
        setShowGameOver(false);
        setGameResult(null);
        setIsCreatingGame(false);
        setSelectedMode('ai');
      };
      
      // Use a longer timeout to batch state changes and prevent flickering
      setTimeout(() => {
        resetState();
        // Initialize new local game after all state is cleared
        setTimeout(() => {
          initializeLocalGame();
        }, 150);
      }, 200); // Longer delay to prevent rapid state changes
    }
  };

  const handleGameStart = (game: any) => {
    console.log('🎮 handleGameStart called with game:', game);
    setCurrentGame(game);
  };

  const handleMatchmakingStart = () => {
    setShowMatchmaking(true);
    setIsMatchmaking(true);
  };

  const handleMatchmakingClose = () => {
    setShowMatchmaking(false);
    setIsMatchmaking(false);
  };

  const handleMatchFound = (room: any) => {
    setIsMatchmaking(false);
    handleRoomJoin(room);
  };

  // Initialize local game for AI and pass-play modes when no game exists
  const initializeLocalGame = () => {
    if (selectedMode === 'ai' || selectedMode === 'pass-play') {
      console.log('🎮 Initializing local game for mode:', selectedMode);
      const newGame = {
        id: `local-game-${Date.now()}`,
        board: {},
        currentPlayer: 'X',
        status: 'active',
        gameMode: selectedMode,
        aiDifficulty,
        playerXId: user?.userId || user?.id,
        playerOId: selectedMode === 'ai' ? 'ai' : 'player2',
        playerXInfo: {
          displayName: 'Player X',
          firstName: 'Player X',
          username: 'Player X'
        },
        playerOInfo: selectedMode === 'ai' ? {
          displayName: 'AI',
          firstName: 'AI',
          username: 'AI'
        } : {
          displayName: 'Player O',
          firstName: 'Player O',
          username: 'Player O'
        }
      };
      console.log('🎮 Created local game:', newGame);
      setCurrentGame(newGame);
    }
  };

  // Auto-initialize game when switching to AI or pass-play mode
  useEffect(() => {
    if (selectedMode === 'ai' || selectedMode === 'pass-play') {
      console.log('🎮 Mode changed to:', selectedMode);
      // Clear any online game state first
      if (currentGame && currentGame.gameMode === 'online') {
        console.log('🎮 Clearing online game state for local mode');
        setCurrentGame(null);
        setCurrentRoom(null);
        setShowGameOver(false);
        setGameResult(null);
        setIsCreatingGame(false);
      }
      
      // Initialize local game if no game exists or if switching from online
      if (!currentGame || currentGame.gameMode === 'online') {
        console.log('🎮 Auto-initializing game for mode:', selectedMode);
        setTimeout(() => {
          initializeLocalGame();
        }, 100);
      }
    }
  }, [selectedMode, currentGame, user]);

  // Fix white screen issue by ensuring game exists for all modes
  useEffect(() => {
    console.log('🎮 Effect check - currentGame:', !!currentGame, 'currentRoom:', !!currentRoom, 'selectedMode:', selectedMode);
    if (!currentGame && !currentRoom && selectedMode !== 'online') {
      console.log('🎮 White screen fix - initializing local game');
      initializeLocalGame();
    }
  }, [currentGame, currentRoom, selectedMode, user]);

  // Add effect to prevent game state loss on WebSocket reconnections
  useEffect(() => {
    if (currentGame && currentRoom && !isConnected) {
      console.log('🔌 WebSocket disconnected but have game/room, maintaining state');
      // Don't reset game state on WebSocket disconnection
    }
  }, [isConnected, currentGame, currentRoom]);

  // Auto-rejoin room when WebSocket reconnects
  useEffect(() => {
    if (isConnected && currentRoom) {
      console.log('🔌 WebSocket reconnected, rejoining room:', currentRoom.id);
      joinRoom(currentRoom.id);
    }
  }, [isConnected, currentRoom]);

  // Force game initialization when user becomes available
  useEffect(() => {
    if (user && !currentGame && !currentRoom && selectedMode !== 'online') {
      console.log('🎮 User available - initializing local game');
      initializeLocalGame();
    }
  }, [user]);

  // Update AI difficulty when changed - reset the game
  useEffect(() => {
    if (currentGame && selectedMode === 'ai') {
      console.log('🎮 AI difficulty changed, resetting game');
      // Reset the game completely when difficulty changes
      const newGame = {
        id: `local-game-${Date.now()}`,
        board: {},
        currentPlayer: 'X',
        status: 'active',
        gameMode: selectedMode,
        aiDifficulty,
        playerXId: user?.userId || user?.id,
        playerOId: 'ai',
        playerXInfo: {
          displayName: 'Player X',
          firstName: 'Player X',
          username: 'Player X'
        },
        playerOInfo: {
          displayName: 'AI',
          firstName: 'AI',
          username: 'AI'
        }
      };
      setCurrentGame(newGame);
    }
  }, [aiDifficulty, selectedMode, user]);

  const handleGameOver = (result: any) => {
    console.log('🎮 handleGameOver called with result:', result);

    // Ultra-simple approach - just store the winner and condition
    const simpleResult = {
      winner: result?.winner || null,
      winnerName: result?.winnerName || (result?.winner === 'X' ? 'Player X' : result?.winner === 'O' ? 'AI' : null),
      condition: result?.condition || 'unknown'
    };

    console.log('🎮 Setting simple game result:', simpleResult);
    setGameResult(simpleResult);
    setShowGameOver(true);
  };

  const handlePlayAgain = async () => {
    if (isCreatingGame) {
      console.log('🎮 Already creating game, ignoring request');
      return;
    }

    setIsCreatingGame(true);
    setShowGameOver(false);
    setGameResult(null);

    if (selectedMode === 'online' && currentRoom) {
      // For online mode, create a new game in the same room
      try {
        console.log('🎮 Creating new game for room:', currentRoom.id);
        
        // Clear the current game first to prevent using finished game
        setCurrentGame(null);
        
        const response = await fetch(`/api/rooms/${currentRoom.id}/start-game`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const newGame = await response.json();
          console.log('🎮 New game created for play again:', newGame);
          console.log('🎮 Game created successfully, waiting for server broadcast to all participants');
          
          // Don't set the game locally - let the server broadcast handle it
          // This ensures both players get the exact same game state at the same time

          // Sound effects removed as requested
        } else {
          console.error('Failed to create new game:', response.status);
          // Reset game state on error
          setCurrentGame(null);
        }
      } catch (error) {
        console.error('Error starting new game:', error);
        // Reset game state on error
        setCurrentGame(null);
      }
    } else {
      // For AI and pass-play modes, restart locally
      const newGame = {
        id: `local-game-${Date.now()}`,
        board: {},
        currentPlayer: 'X',
        status: 'active',
        gameMode: selectedMode,
        aiDifficulty,
        playerXId: user?.userId || user?.id,
        playerOId: selectedMode === 'ai' ? 'ai' : 'player2',
        playerXInfo: {
          displayName: 'Player X',
          firstName: 'Player X',
          username: 'Player X'
        },
        playerOInfo: selectedMode === 'ai' ? {
          displayName: 'AI',
          firstName: 'AI',
          username: 'AI'
        } : {
          displayName: 'Player O',
          firstName: 'Player O',
          username: 'Player O'
        }
      };

      setCurrentGame(newGame);
      // Sound effects removed as requested
    }

    // Reset creating state after a short delay
    setTimeout(() => {
      setIsCreatingGame(false);
    }, 1000);
  };



  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation Header */}
      <nav className="bg-slate-800 border-b border-slate-700 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-lg flex items-center justify-center">
              <GamepadIcon className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </div>
            <h1 className="text-lg md:text-xl font-bold">{t('playerDashboard')}</h1>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="flex items-center space-x-2 md:space-x-3">
              {user?.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt="Profile" 
                  className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 md:w-8 md:h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 md:w-5 md:h-5 text-white" />
                </div>
              )}
              <span className="text-sm md:text-base text-gray-300 hidden sm:block">
                {user?.displayName || user?.firstName || user?.username || 'Player'}
              </span>
            </div>
            <div className="flex items-center space-x-1 md:space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs md:text-sm text-gray-400">
                {isConnected ? t('online') : t('offline')}
              </span>
            </div>
            
            {/* Leaderboard Button - Mobile Optimized */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLeaderboard(true)}
              className="bg-gradient-to-r from-yellow-600 to-orange-600 border-yellow-500 text-white hover:from-yellow-500 hover:to-orange-500 px-2 md:px-3 py-1 md:py-2"
            >
              <Trophy className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline ml-1 md:ml-2">{t('leaderboard') || 'Leaderboard'}</span>
            </Button>
            
            <div className="relative" ref={headerSidebarRef}>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowHeaderSidebar(!showHeaderSidebar)}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 px-2 md:px-4 py-1 md:py-2"
              >
                {showHeaderSidebar ? (
                  <X className="w-3 h-3 md:w-4 md:h-4" />
                ) : (
                  <Menu className="w-3 h-3 md:w-4 md:h-4" />
                )}
                <span className="hidden sm:inline ml-1 md:ml-2">Menu</span>
              </Button>
              
              {/* Header Sidebar */}
              {showHeaderSidebar && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 overflow-visible">
                  <div className="p-4 space-y-4 overflow-visible">
                    <div className="text-sm font-medium text-gray-300 border-b border-slate-700 pb-2">
                      {t('quickActions')}
                    </div>
                    
                    {/* Language Selector */}
                    <div className="flex items-center justify-between overflow-visible">
                      <div className="flex items-center space-x-2">
                        <Languages className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{t('language')}</span>
                      </div>
                      <div className="relative z-[9999]">
                        <CustomLanguageSelector />
                      </div>
                    </div>
                    
                    {/* Theme Selector */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Palette className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{t('theme')}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Theme change button clicked');
                          // Don't close the sidebar, just open theme selector
                          const event = new CustomEvent('openThemeSelector');
                          window.dispatchEvent(event);
                        }}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs cursor-pointer"
                      >
                        <Palette className="h-3 w-3 mr-1" />
                        {t('change')}
                      </Button>
                    </div>
                    
                    {/* Friends */}
                    <div className="w-full">
                      <Friends />
                    </div>
                    
                    {/* Online Players */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{t('onlineUsers')}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowOnlineUsers(true);
                          setShowHeaderSidebar(false);
                        }}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs"
                      >
                        {onlineUserCount} {t('playersLabel')}
                      </Button>
                    </div>
                    
                    {/* Achievements */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{t('achievements')}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowAchievements(true);
                          setShowHeaderSidebar(false);
                        }}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs"
                      >
                        <Trophy className="h-3 w-3 mr-1" />
                        {t('view')}
                      </Button>
                    </div>
                    

                    
                    {/* Profile Settings */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Settings className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{t('profileSettings')}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowHeaderSidebar(false);
                          // Give a small delay to ensure sidebar is closed before opening profile
                          setTimeout(() => {
                            setShowProfile(true);
                          }, 100);
                        }}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs"
                      >
{t('settings')}
                      </Button>
                    </div>
                    
                    {/* Logout */}
                    <div className="border-t border-slate-700 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => logout()}
                        className="w-full bg-red-700 border-red-600 text-white hover:bg-red-600 justify-start"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
{t('logout')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Game Board Section */}
          <div className="lg:col-span-2">
            {currentGame ? (
              <div>
                <div className="mb-4 text-center">
                  <span className="text-sm text-gray-400">
                    Game ID: {currentGame.id} | Room: {currentRoom?.code || 'Local'}
                  </span>
                </div>
                <GameBoard 
                  key={currentGame?.id}
                  game={currentGame}
                  onGameOver={handleGameOver}
                  gameMode={selectedMode}
                  user={user}
                  lastMessage={lastMessage}
                  sendMessage={sendMessage}
                />
              </div>
            ) : (
              <div className="text-center p-8 text-gray-400">
                <p>No active game. Select a game mode to start playing.</p>
              </div>
            )}

            {/* Game Rules */}
            <Card className="mt-4 sm:mt-6 bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">{t('gameRules')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-300 pt-0">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                  <span>{t('horizontalWin')}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                  <span>{t('verticalWin')}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>
                  <span>{t('diagonalWin')}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2"></div>
                  <span>{t('gridLayout')}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* User Profile */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center space-x-2">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-center">
                  {user?.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt="Profile" 
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover mx-auto mb-2 sm:mb-3"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                      <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                  )}
                  <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3 px-2 truncate">
                    {user?.displayName || user?.username || 'Player'}
                  </p>
                  <ProfileManager user={user} open={false} />
                </div>
              </CardContent>
            </Card>



            {/* Game Mode Selection */}
            <GameModeSelector 
              selectedMode={selectedMode}
              onModeChange={(mode) => {
                // Sound effects removed as requested
                setSelectedMode(mode);
              }}
              aiDifficulty={aiDifficulty}
              onDifficultyChange={setAiDifficulty}
            />



            {/* Online Room Management */}
            {selectedMode === 'online' && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg">{t('onlineMode')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!currentRoom && (
                      <>
                        <div className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/20">
                          <div className="text-center space-y-3">
                            <div className="text-sm font-semibold text-blue-300">{t('quickMatch')}</div>
                            <p className="text-xs text-gray-400">
                              {t('getMatchedWithAnotherPlayer')}
                            </p>
                            <Button 
                              onClick={handleMatchmakingStart}
                              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                              disabled={isMatchmaking}
                            >
                              {isMatchmaking ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  {t('thinking')}
                                </>
                              ) : (
                                <>
                                  <Zap className="w-4 h-4 mr-2" />
                                  {t('findMatch')}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-center text-sm text-gray-500">
                          <span>{t('or')}</span>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm text-gray-300 mb-2">
                            {t('createOrJoinRoom')}
                          </p>
                        </div>
                      </>
                    )}
                    
                    {currentRoom && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">{t('connectedToRoom')} {currentRoom.code}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Room Management */}
            {selectedMode === 'online' && (
              <RoomManager 
                currentRoom={currentRoom}
                onRoomJoin={handleRoomJoin}
                onRoomLeave={handleRoomLeave}
                onCreateRoom={() => setShowCreateRoom(true)}
                onGameStart={handleGameStart}
                gameMode={selectedMode}
                user={user}
              />
            )}

            {/* Players & Spectators */}
            {currentRoom && (
              <PlayerList roomId={currentRoom.id} />
            )}

            {/* Audio Controls removed as requested */}

            {/* Game Statistics */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">{t('gameStats')}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 text-center">
                  <div className="p-2 sm:p-3 bg-slate-700 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-blue-500">
                      {userStats?.wins || 0}
                    </div>
                    <div className="text-xs text-gray-400">{t('wins')}</div>
                  </div>
                  <div className="p-2 sm:p-3 bg-slate-700 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-red-500">
                      {userStats?.losses || 0}
                    </div>
                    <div className="text-xs text-gray-400">{t('losses')}</div>
                  </div>
                  <div className="p-2 sm:p-3 bg-slate-700 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-yellow-500">
                      {userStats?.draws || 0}
                    </div>
                    <div className="text-xs text-gray-400">{t('draws')}</div>
                  </div>
                  <div className="p-2 sm:p-3 bg-slate-700 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-gray-400">
                      {(userStats?.wins || 0) + (userStats?.losses || 0) + (userStats?.draws || 0)}
                    </div>
                    <div className="text-xs text-gray-400">{t('total')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateRoomModal 
        open={showCreateRoom}
        onClose={() => setShowCreateRoom(false)}
        onRoomCreated={handleRoomJoin}
      />

      <GameOverModal 
        open={showGameOver}
        onClose={() => setShowGameOver(false)}
        result={gameResult}
        onPlayAgain={handlePlayAgain}
        isCreatingGame={isCreatingGame}
        onMainMenu={resetToMainMenu}
      />

      {showEmailVerification && user?.email && (
        <EmailVerificationModal 
          email={user.email}
          onClose={() => setShowEmailVerification(false)}
        />
      )}

      <MatchmakingModal 
        open={showMatchmaking}
        onClose={handleMatchmakingClose}
        onMatchFound={handleMatchFound}
        user={user}
      />

      <OnlineUsersModal 
        open={showOnlineUsers}
        onClose={() => setShowOnlineUsers(false)}
        currentRoom={currentRoom}
        user={user}
      />

      <ProfileManager 
        user={user}
        open={showProfile}
        onClose={() => setShowProfile(false)}
      />

      <ThemeSelector />

      <AchievementModal 
        open={showAchievements}
        onClose={() => setShowAchievements(false)}
        user={user}
      />

      <Leaderboard 
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        trigger={
          <div style={{ display: 'none' }} />
        }
      />

      {/* Global Room Invitation Popup */}
      <InvitationPopup onRoomJoin={handleRoomJoin} />

    </div>
  );
}