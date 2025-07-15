import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
// useAudio hook removed as sound effects are removed
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { GameBoard } from "@/components/GameBoard";
import { GameModeSelector } from "@/components/GameModeSelector";
import { ProfileManager } from "@/components/ProfileManager";
// AudioControls component removed as requested
import { RoomManager } from "@/components/RoomManager";
import { PlayerList } from "@/components/PlayerList";
import { CreateRoomModal } from "@/components/CreateRoomModal";
import { GameOverModal } from "@/components/GameOverModal";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GamepadIcon, LogOut, User } from "lucide-react";
import { logout } from "@/lib/firebase";

export default function Home() {
  const { user } = useAuth();
  const { isConnected, lastMessage, joinRoom, leaveRoom, sendMessage } = useWebSocket();
  // Sound effects removed as requested
  const [selectedMode, setSelectedMode] = useState<'ai' | 'pass-play' | 'online'>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  // Remove matchmaking state variables

  const { data: userStats } = useQuery({
    queryKey: ["/api/users", user?.id, "stats"],
    enabled: !!user,
  });

  useEffect(() => {
    if (lastMessage) {
      console.log('🎮 Home received WebSocket message:', lastMessage);
      switch (lastMessage.type) {
        case 'game_started':
          console.log('🎮 Processing game_started message:', lastMessage);
          console.log('🎮 Current room ID:', currentRoom?.id);
          console.log('🎮 Message room ID:', lastMessage.roomId);
          console.log('🎮 Game data:', lastMessage.game);
          // Handle game start from WebSocket - ensure both players transition
          if (lastMessage.roomId === currentRoom?.id) {
            console.log('🎮 Setting current game from WebSocket:', lastMessage.game);
            // Force complete state update to ensure game appears
            setCurrentGame(prevGame => {
              console.log('🎮 Game state update - prev:', prevGame, 'new:', lastMessage.game);
              return lastMessage.game;
            });
            // Reset creating state since game was successfully created
            setIsCreatingGame(false);
            // Also reset game over state if it was showing
            setShowGameOver(false);
            setGameResult(null);
          }
          break;
        case 'move':
          // Handle move updates from WebSocket - FOR BOTH PLAYERS AND SPECTATORS
          if (currentGame && lastMessage.gameId === currentGame.id) {
            console.log('🎮 Home received move WebSocket message:', lastMessage);
            console.log('🎮 Updating game board from:', currentGame.board, 'to:', lastMessage.board);
            // Update the current game state immediately for everyone (players and spectators)
            setCurrentGame(prevGame => ({
              ...prevGame,
              board: lastMessage.board,
              currentPlayer: lastMessage.currentPlayer,
              lastMove: lastMessage.position,
              playerXInfo: lastMessage.playerXInfo || prevGame.playerXInfo,
              playerOInfo: lastMessage.playerOInfo || prevGame.playerOInfo,
              timestamp: Date.now() // Force re-render
            }));
            // Sound effects removed as requested
          } else if (currentRoom && (lastMessage.roomId === currentRoom.id || lastMessage.gameId)) {
            // If we're in the room but don't have currentGame set, set it from the move message
            console.log('🎮 Spectator receiving move for room game');
            if (!currentGame) {
              // Create a basic game object for spectators with player info
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
            setGameResult({
              winner: lastMessage.winner,
              condition: lastMessage.condition,
              board: lastMessage.board,
              winnerInfo: lastMessage.winnerInfo
            });
            setShowGameOver(true);
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
          // Handle room ending - redirect to main menu
          if (currentRoom && lastMessage.roomId === currentRoom.id) {
            console.log('🎮 Room ended, redirecting to main menu');
            resetToMainMenu();
          }
          break;
        // Remove matchmaking WebSocket handlers
      }
    }
  }, [lastMessage, currentGame, currentRoom, user]);

  const handleRoomJoin = (room: any) => {
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
    // Leave room if currently in one
    if (currentRoom) {
      leaveRoom(currentRoom.id);
    }
    
    setCurrentRoom(null);
    setCurrentGame(null);
    setShowGameOver(false);
    setGameResult(null);
    setIsCreatingGame(false);
    setSelectedMode('ai');
  };

  const handleGameStart = (game: any) => {
    console.log('🎮 handleGameStart called with game:', game);
    setCurrentGame(game);
  };

  // Remove matchmaking functions - only keeping create room and join room

  // Initialize local game for AI and pass-play modes when no game exists
  const initializeLocalGame = () => {
    if (selectedMode === 'ai' || selectedMode === 'pass-play') {
      console.log('🎮 Initializing local game for mode:', selectedMode);
      const newGame = {
        id: 'local-game',
        board: {},
        currentPlayer: 'X',
        status: 'active',
        gameMode: selectedMode,
        aiDifficulty,
        playerXId: user?.userId || user?.id,
        playerOId: selectedMode === 'ai' ? 'ai' : 'player2',
        playerXInfo: {
          displayName: user?.displayName || user?.firstName || user?.username || 'Player X',
          firstName: user?.firstName || user?.displayName || user?.username || 'Player X',
          username: user?.username || 'Player X',
          profilePicture: user?.profilePicture || user?.profileImageUrl
        },
        playerOInfo: selectedMode === 'ai' ? {
          displayName: `AI (${aiDifficulty})`,
          firstName: `AI (${aiDifficulty})`,
          username: `AI (${aiDifficulty})`
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
    if (!currentGame && (selectedMode === 'ai' || selectedMode === 'pass-play')) {
      initializeLocalGame();
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

  // Force game initialization when user becomes available
  useEffect(() => {
    if (user && !currentGame && !currentRoom && selectedMode !== 'online') {
      console.log('🎮 User available - initializing local game');
      initializeLocalGame();
    }
  }, [user]);

  // Update AI difficulty when changed
  useEffect(() => {
    if (currentGame && selectedMode === 'ai') {
      console.log('🎮 AI difficulty changed, updating game');
      const updatedGame = {
        ...currentGame,
        aiDifficulty,
        playerOInfo: {
          displayName: `AI (${aiDifficulty})`,
          firstName: `AI (${aiDifficulty})`,
          username: `AI (${aiDifficulty})`
        }
      };
      setCurrentGame(updatedGame);
    }
  }, [aiDifficulty, selectedMode]);

  const handleGameOver = (result: any) => {
    // Sound effects removed as requested
    console.log('🎮 Game over result:', result);
    // Ensure game stays available to prevent white screen
    if (result.game) {
      console.log('🎮 Preserving game state for game over modal:', result.game);
      setCurrentGame(result.game);
    }
    // Preserve game state even if not in result
    if (!result.game && currentGame) {
      console.log('🎮 Using current game state for game over modal:', currentGame);
      result.game = currentGame;
    }
    setGameResult(result);
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
        const response = await fetch(`/api/rooms/${currentRoom.id}/start-game`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const newGame = await response.json();
          console.log('🎮 New game created for play again:', newGame);
          setCurrentGame(newGame);
          
          // No need to broadcast manually, server will handle it
          console.log('🎮 Game created successfully, server will broadcast to all participants');
          
          // Sound effects removed as requested
        } else {
          console.error('Failed to create new game:', response.status);
        }
      } catch (error) {
        console.error('Error starting new game:', error);
      }
    } else {
      // For AI and pass-play modes, restart locally
      const newGame = {
        id: Date.now().toString(),
        board: {},
        currentPlayer: 'X',
        status: 'active',
        playerX: user?.id || 'local-x',
        playerO: selectedMode === 'ai' ? 'ai' : 'local-o',
        playerXInfo: user,
        playerOInfo: selectedMode === 'ai' ? { username: 'AI', displayName: 'AI Player' } : null,
        gameMode: selectedMode,
        createdAt: new Date().toISOString()
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
            <h1 className="text-lg md:text-xl font-bold">TicTac 3x5</h1>
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
              <span className="text-xs text-gray-500 hidden lg:block">
                ({user?.userId || user?.id})
              </span>
            </div>
            <div className="flex items-center space-x-1 md:space-x-2">
              <span className="text-xs md:text-sm text-gray-300 mr-2">
                {user?.displayName || user?.firstName || user?.username || 'Player'}
              </span>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs md:text-sm text-gray-400">
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => logout()}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 px-2 md:px-4 py-1 md:py-2"
            >
              <LogOut className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Out</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
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
                  key={`${currentGame?.id}-${JSON.stringify(currentGame?.board)}`}
                  game={currentGame}
                  onGameOver={handleGameOver}
                  gameMode={selectedMode}
                  user={user}
                />
              </div>
            ) : (
              <div className="text-center p-8 text-gray-400">
                <p>No active game. Select a game mode to start playing.</p>
              </div>
            )}

            {/* Game Rules */}
            <Card className="mt-6 bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg">Game Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                  <span><strong>Horizontal Win:</strong> Get 4 symbols in a row horizontally</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></div>
                  <span><strong>Vertical Win:</strong> Get 3 symbols in a column vertically</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2"></div>
                  <span><strong>Diagonal Win:</strong> Get 3 symbols diagonally (positions 5, 10, 15 restricted)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2"></div>
                  <span><strong>Grid Layout:</strong> 3 rows × 5 columns (positions 1-15)</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                  <span><strong>Valid Diagonal Patterns:</strong> [1,7,13], [2,8,14], [3,7,11], [4,8,12]</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2"></div>
                  <span><strong>Restricted:</strong> No diagonal wins using the rightmost column (5, 10, 15)</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Profile */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  {user?.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full object-cover mx-auto mb-3"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <p className="text-sm text-gray-300 mb-3">
                    {user?.displayName || user?.username || 'Player'}
                  </p>
                  <ProfileManager user={user} />
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
                  <CardTitle className="text-lg">Online Room Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-300">
                      Create a room or join an existing room to play online with friends.
                    </p>
                    {currentRoom && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Connected to room {currentRoom.code}</span>
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
              <CardHeader>
                <CardTitle className="text-lg">Game Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <div className="text-2xl font-bold text-blue-500">
                      {userStats?.wins || 0}
                    </div>
                    <div className="text-xs text-gray-400">Wins</div>
                  </div>
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <div className="text-2xl font-bold text-red-500">
                      {userStats?.losses || 0}
                    </div>
                    <div className="text-xs text-gray-400">Losses</div>
                  </div>
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-500">
                      {userStats?.draws || 0}
                    </div>
                    <div className="text-xs text-gray-400">Draws</div>
                  </div>
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <div className="text-2xl font-bold text-gray-400">
                      {(userStats?.wins || 0) + (userStats?.losses || 0) + (userStats?.draws || 0)}
                    </div>
                    <div className="text-xs text-gray-400">Total</div>
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
    </div>
  );
}
