import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { GameBoard } from "@/components/GameBoard";
import { GameModeSelector } from "@/components/GameModeSelector";
import { RoomManager } from "@/components/RoomManager";
import { PlayerList } from "@/components/PlayerList";
import { CreateRoomModal } from "@/components/CreateRoomModal";
import { GameOverModal } from "@/components/GameOverModal";
import { MatchmakingModal } from "@/components/MatchmakingModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GamepadIcon, LogOut, Zap, Loader2, Users, ArrowLeft } from "lucide-react";

interface GamePageProps {
  onPageChange: (page: string) => void;
}

export function GamePage({ onPageChange }: GamePageProps) {
  const { user } = useAuth();
  const { isConnected, lastMessage, joinRoom, leaveRoom, sendMessage } = useWebSocket();
  const { toast } = useToast();
  
  const [selectedMode, setSelectedMode] = useState<'ai' | 'pass-play' | 'online'>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [showMatchmaking, setShowMatchmaking] = useState(false);
  const [isMatchmaking, setIsMatchmaking] = useState(false);

  // Handle quick match event from HomePage
  useEffect(() => {
    const handleQuickMatch = () => {
      setIsMatchmaking(true);
      setShowMatchmaking(true);
      // Start matchmaking
      sendMessage({
        type: 'find_match',
        userId: user?.userId || user?.id,
        playerName: user?.displayName || user?.firstName || user?.username || 'Player'
      });
    };

    window.addEventListener('quickMatch', handleQuickMatch);
    return () => window.removeEventListener('quickMatch', handleQuickMatch);
  }, [user, sendMessage]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      console.log('🎮 Game page received WebSocket message:', lastMessage);
      switch (lastMessage.type) {
        case 'game_started':
          if (lastMessage.roomId === currentRoom?.id) {
            console.log('🎮 Setting current game from WebSocket:', lastMessage.game);
            setCurrentGame(lastMessage.game);
            setIsCreatingGame(false);
          }
          break;
        case 'game_move':
          if (currentGame && lastMessage.gameId === currentGame.id) {
            setCurrentGame(prev => ({
              ...prev,
              board: lastMessage.board,
              currentPlayer: lastMessage.currentPlayer,
              moveCount: lastMessage.moveCount
            }));
          }
          break;
        case 'game_over':
          if (currentGame && lastMessage.gameId === currentGame.id) {
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
            setGameResult(gameResult);
            setShowGameOver(true);
          }
          break;
        case 'match_found':
          setIsMatchmaking(false);
          setShowMatchmaking(false);
          handleRoomJoin(lastMessage.room);
          toast({
            title: "Match Found!",
            description: "You've been matched with an opponent. Game starting...",
          });
          break;
        case 'room_ended':
          if (currentRoom && lastMessage.roomId === currentRoom.id) {
            toast({
              title: "Room Ended",
              description: `${lastMessage.playerName || 'A player'} left the room.`,
              duration: 2000,
            });
            resetToMainMenu();
          }
          break;
      }
    }
  }, [lastMessage, currentGame, currentRoom, user]);

  const handleRoomJoin = (room: any) => {
    setCurrentRoom(room);
    joinRoom(room.id);
  };

  const resetToMainMenu = () => {
    if (currentRoom) {
      const leaveMessage = {
        type: 'leave_room',
        roomId: currentRoom.id,
        userId: user?.userId || user?.id,
        playerName: user?.displayName || user?.firstName || user?.username || 'Player'
      };
      sendMessage(leaveMessage);
    }
    
    setCurrentRoom(null);
    setCurrentGame(null);
    setShowGameOver(false);
    setGameResult(null);
    setIsCreatingGame(false);
    setSelectedMode('ai');
  };

  const handleGameStart = (game: any) => {
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

  const createNewGame = async () => {
    setIsCreatingGame(true);
    try {
      if (selectedMode === 'online') {
        if (!currentRoom) {
          toast({
            title: "No Room",
            description: "Please join or create a room first.",
            variant: "destructive",
          });
          return;
        }

        const response = await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: currentRoom.id,
            gameMode: selectedMode,
            aiDifficulty: selectedMode === 'ai' ? aiDifficulty : undefined
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create game');
        }

        const game = await response.json();
        setCurrentGame(game);
      } else {
        // For AI and pass-and-play modes
        const response = await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameMode: selectedMode,
            aiDifficulty: selectedMode === 'ai' ? aiDifficulty : undefined
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create game');
        }

        const game = await response.json();
        setCurrentGame(game);
      }
    } catch (error) {
      console.error('Error creating game:', error);
      toast({
        title: "Error",
        description: "Failed to create game. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsCreatingGame(false);
      }, 1000);
    }
  };

  // Show game board if there's an active game
  if (currentGame) {
    return (
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={resetToMainMenu}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Menu</span>
          </Button>
          
          <Badge variant="secondary" className="bg-blue-600/20 text-blue-400">
            {selectedMode === 'ai' ? `AI (${aiDifficulty})` : 
             selectedMode === 'pass-play' ? 'Pass & Play' : 'Online'}
          </Badge>
        </div>

        <GameBoard
          game={currentGame}
          currentUser={user}
          onGameOver={(result) => {
            setGameResult(result);
            setShowGameOver(true);
          }}
          gameMode={selectedMode}
          aiDifficulty={aiDifficulty}
        />

        {/* Game Over Modal */}
        {showGameOver && gameResult && (
          <GameOverModal
            gameResult={gameResult}
            onClose={() => setShowGameOver(false)}
            onPlayAgain={createNewGame}
            onMainMenu={resetToMainMenu}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Choose Your Game Mode</h1>
        <p className="text-slate-400">Select how you want to play</p>
      </div>

      {/* Game Mode Selection */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GamepadIcon className="w-5 h-5" />
            <span>Game Modes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GameModeSelector
            selectedMode={selectedMode}
            onModeChange={setSelectedMode}
            aiDifficulty={aiDifficulty}
            onDifficultyChange={setAiDifficulty}
          />
        </CardContent>
      </Card>

      {/* Room Management for Online Mode */}
      {selectedMode === 'online' && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Online Room</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RoomManager
              currentRoom={currentRoom}
              onRoomJoin={handleRoomJoin}
              onRoomLeave={resetToMainMenu}
              onCreateRoom={() => setShowCreateRoom(true)}
              onMatchmakingStart={handleMatchmakingStart}
              isConnected={isConnected}
            />
            
            {currentRoom && (
              <div className="mt-4">
                <PlayerList roomId={currentRoom.id} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Start Game Button */}
      <div className="text-center">
        <Button
          onClick={createNewGame}
          disabled={isCreatingGame || (selectedMode === 'online' && !currentRoom)}
          className="h-12 px-8 text-lg"
          size="lg"
        >
          {isCreatingGame ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Zap className="w-5 h-5 mr-2" />
          )}
          {isCreatingGame ? 'Creating Game...' : 'Start Game'}
        </Button>
        
        {selectedMode === 'online' && !currentRoom && (
          <p className="text-sm text-slate-400 mt-2">
            Join or create a room to start playing online
          </p>
        )}
      </div>

      {/* Modals */}
      {showCreateRoom && (
        <CreateRoomModal
          onClose={() => setShowCreateRoom(false)}
          onRoomCreated={handleRoomJoin}
        />
      )}

      {showMatchmaking && (
        <MatchmakingModal
          isMatchmaking={isMatchmaking}
          onClose={handleMatchmakingClose}
        />
      )}
    </div>
  );
}