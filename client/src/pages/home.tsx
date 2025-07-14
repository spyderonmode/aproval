import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { GameBoard } from "@/components/GameBoard";
import { GameModeSelector } from "@/components/GameModeSelector";
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
  const [selectedMode, setSelectedMode] = useState<'ai' | 'pass-play' | 'online'>('ai');
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);

  const { data: userStats } = useQuery({
    queryKey: ["/api/users", user?.id, "stats"],
    enabled: !!user,
  });

  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'move':
        case 'ai_move':
          // Handle move updates
          if (currentGame && lastMessage.gameId === currentGame.id) {
            setCurrentGame(prev => ({
              ...prev,
              board: lastMessage.board,
              currentPlayer: lastMessage.player === 'X' ? 'O' : 'X',
            }));
          }
          break;
        case 'game_over':
          setGameResult(lastMessage);
          setShowGameOver(true);
          break;
      }
    }
  }, [lastMessage, currentGame]);

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
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-300">{user?.username || 'Player'}</span>
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
                  <span><strong>Diagonal Win:</strong> Get 3 symbols on straight diagonal lines</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                  <span><strong>Grid:</strong> Complete 3x5 board with positions 1-15</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2"></div>
                  <span><strong>Strategy:</strong> Only diagonal patterns count - no horizontal or vertical wins</span>
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
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm text-gray-300">
                    {user?.username || 'Player'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Game Mode Selection */}
            <GameModeSelector 
              selectedMode={selectedMode}
              onModeChange={setSelectedMode}
            />

            {/* Room Management */}
            <RoomManager 
              currentRoom={currentRoom}
              onRoomJoin={handleRoomJoin}
              onRoomLeave={handleRoomLeave}
              onCreateRoom={() => setShowCreateRoom(true)}
              onGameStart={handleGameStart}
              gameMode={selectedMode}
            />

            {/* Players & Spectators */}
            {currentRoom && (
              <PlayerList roomId={currentRoom.id} />
            )}

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
