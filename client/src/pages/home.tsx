import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAudio } from "@/hooks/useAudio";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { GameBoard } from "@/components/GameBoard";
import { GameModeSelector } from "@/components/GameModeSelector";
import { ProfileManager } from "@/components/ProfileManager";
import { AudioControls } from "@/components/AudioControls";
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
  const { isConnected, lastMessage, joinRoom, leaveRoom } = useWebSocket();
  const { playSound } = useAudio();
  const [selectedMode, setSelectedMode] = useState<'ai' | 'pass-play' | 'online'>('ai');
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchmakingStatus, setMatchmakingStatus] = useState('');

  const { data: userStats } = useQuery({
    queryKey: ["/api/users", user?.id, "stats"],
    enabled: !!user,
  });

  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'game_started':
          // Handle game start from WebSocket
          if (lastMessage.roomId === currentRoom?.id) {
            setCurrentGame(lastMessage.game);
          }
          break;
        case 'game_over':
          // Handle game over from WebSocket
          if (currentGame && lastMessage.gameId === currentGame.id) {
            // Play appropriate sound based on result
            const userId = user?.userId || user?.id;
            if (lastMessage.winner === userId) {
              playSound('win');
            } else if (lastMessage.winner === null) {
              playSound('draw');
            } else {
              playSound('lose');
            }
            setGameResult({
              winner: lastMessage.winner,
              condition: lastMessage.condition,
              board: lastMessage.board
            });
            setShowGameOver(true);
          }
          break;
        case 'match_found':
          // Handle successful matchmaking
          setIsMatchmaking(false);
          setMatchmakingStatus('');
          setCurrentRoom(lastMessage.room);
          joinRoom(lastMessage.room.id);
          break;
        case 'matchmaking_response':
          // Handle matchmaking response for waiting players
          if (lastMessage.status === 'matched') {
            setIsMatchmaking(false);
            setMatchmakingStatus('');
            setCurrentRoom(lastMessage.room);
            joinRoom(lastMessage.room.id);
          }
          break;
      }
    }
  }, [lastMessage, currentGame, currentRoom, user, playSound]);

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

  const handleGameStart = (game: any) => {
    setCurrentGame(game);
  };

  const handleStartOnlineMatch = async () => {
    try {
      setIsMatchmaking(true);
      setMatchmakingStatus('Searching for opponent...');
      
      const response = await fetch('/api/matchmaking/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to join matchmaking');
      }
      
      const data = await response.json();
      
      if (data.status === 'waiting') {
        setMatchmakingStatus('Waiting for another player...');
      } else if (data.status === 'matched') {
        setIsMatchmaking(false);
        setMatchmakingStatus('');
        setCurrentRoom(data.room);
        joinRoom(data.room.id);
      }
    } catch (error) {
      console.error('Matchmaking error:', error);
      setIsMatchmaking(false);
      setMatchmakingStatus('');
    }
  };

  const handleCancelMatchmaking = async () => {
    try {
      await fetch('/api/matchmaking/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setIsMatchmaking(false);
      setMatchmakingStatus('');
    } catch (error) {
      console.error('Error canceling matchmaking:', error);
    }
  };

  // Initialize local game for AI and pass-play modes when no game exists
  const initializeLocalGame = () => {
    if (selectedMode === 'ai' || selectedMode === 'pass-play') {
      const newGame = {
        id: 'local-game',
        board: {},
        currentPlayer: 'X',
        status: 'active',
        gameMode: selectedMode,
        playerXId: user?.userId || user?.id,
        playerOId: selectedMode === 'ai' ? 'ai' : 'player2'
      };
      setCurrentGame(newGame);
    }
  };

  // Auto-initialize game when switching to AI or pass-play mode
  useEffect(() => {
    if (!currentGame && (selectedMode === 'ai' || selectedMode === 'pass-play')) {
      initializeLocalGame();
    }
  }, [selectedMode, currentGame, user]);

  const handleGameOver = (result: any) => {
    // Play appropriate sound based on result
    if (result.winner === 'X') {
      playSound('win');
    } else if (result.winner === 'O') {
      playSound('lose');
    } else {
      playSound('draw');
    }
    setGameResult(result);
    setShowGameOver(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation Header */}
      <nav className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <GamepadIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">TicTac 3x5</h1>
          </div>
          
          {/* User Profile */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {user?.profilePicture ? (
                <img 
                  src={user.profilePicture} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="text-gray-300">{user?.displayName || user?.username || 'Player'}</span>
              <span className="text-xs text-gray-500">({user?.userId || user?.id})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-400">
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Board Section */}
          <div className="lg:col-span-2">
            <GameBoard 
              game={currentGame}
              onGameOver={handleGameOver}
              gameMode={selectedMode}
              user={user}
            />

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
                playSound('click');
                setSelectedMode(mode);
              }}
            />

            {/* Online Matchmaking */}
            {selectedMode === 'online' && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg">Online Matchmaking</CardTitle>
                </CardHeader>
                <CardContent>
                  {!currentRoom && !isMatchmaking && (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-300">
                        Find an opponent to play against online in real-time.
                      </p>
                      <Button 
                        onClick={() => {
                          playSound('click');
                          handleStartOnlineMatch();
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Find Match
                      </Button>
                    </div>
                  )}
                  {!currentRoom && isMatchmaking && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                        <span className="text-sm">{matchmakingStatus}</span>
                      </div>
                      <Button 
                        onClick={() => {
                          playSound('click');
                          handleCancelMatchmaking();
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  {currentRoom && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Connected to room {currentRoom.code}</span>
                      </div>
                    </div>
                  )}
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
              />
            )}

            {/* Players & Spectators */}
            {currentRoom && (
              <PlayerList roomId={currentRoom.id} />
            )}

            {/* Audio Controls */}
            <AudioControls />

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
        onPlayAgain={() => {
          setShowGameOver(false);
          setCurrentGame(null);
        }}
      />
    </div>
  );
}
