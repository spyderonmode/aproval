import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, LogOut, Play, UserPlus } from "lucide-react";
import { InviteFriendsModal } from "./InviteFriendsModal";
import { useTranslation } from "@/contexts/LanguageContext";

interface RoomManagerProps {
  currentRoom: any;
  onRoomJoin: (room: any) => void;
  onRoomLeave: () => void;
  onCreateRoom: () => void;
  onGameStart: (game: any) => void;
  gameMode: 'ai' | 'pass-play' | 'online';
  user: any;
}

export function RoomManager({ 
  currentRoom, 
  onRoomJoin, 
  onRoomLeave, 
  onCreateRoom, 
  onGameStart,
  gameMode,
  user 
}: RoomManagerProps) {
  const { t } = useTranslation();
  const [joinCode, setJoinCode] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch participants for the current room
  const { data: participants = [] } = useQuery({
    queryKey: ['room-participants', currentRoom?.id],
    queryFn: async () => {
      if (!currentRoom) return [];
      const response = await apiRequest('GET', `/api/rooms/${currentRoom.id}/participants`);
      return response.json();
    },
    enabled: !!currentRoom,
  });

  const joinRoomMutation = useMutation({
    mutationFn: async (data: { code: string, role: 'player' | 'spectator' }) => {
      const response = await apiRequest('POST', `/api/rooms/${data.code}/join`, { role: data.role });
      return response.json();
    },
    onSuccess: (data) => {
      onRoomJoin(data.room);
      setJoinCode("");
      toast({
        title: t('success'),
        description: t('joinedRoomSuccessfully'),
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: t('unauthorized'),
          description: t('loggedOutLoggingIn'),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startGameMutation = useMutation({
    mutationFn: async () => {
      if (!currentRoom) throw new Error('No room selected');
      
      const response = await apiRequest('POST', `/api/rooms/${currentRoom.id}/start-game`, {});
      return response.json();
    },
    onSuccess: (game) => {
      console.log('🎮 Game started successfully:', game);
      onGameStart(game);
      toast({
        title: t('gameStarted'),
        description: t('letTheBattleBegin'),
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: t('unauthorized'),
          description: t('loggedOutLoggingIn'),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleJoinRoom = (role: 'player' | 'spectator' = 'player') => {
    if (joinCode.trim()) {
      joinRoomMutation.mutate({ 
        code: joinCode.trim().toUpperCase(), 
        role 
      });
    }
  };

  const handleLeaveRoom = () => {
    onRoomLeave();
    toast({
      title: "Left Room",
      description: "You have left the room",
    });
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg">Room Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!currentRoom ? (
          <>
            {/* Join Room */}
            <div className="space-y-2">
              <Input
                placeholder="Room code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="bg-slate-700 border-slate-600 text-white"
                maxLength={8}
              />
              <div className="flex space-x-2">
                <Button 
                  onClick={() => handleJoinRoom('player')}
                  disabled={!joinCode.trim() || joinRoomMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Join as Player
                </Button>
                <Button 
                  onClick={() => handleJoinRoom('spectator')}
                  disabled={!joinCode.trim() || joinRoomMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Join as Spectator
                </Button>
              </div>
            </div>
            
            {/* Create Room */}
            <Button 
              onClick={onCreateRoom}
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={joinRoomMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Room
            </Button>
          </>
        ) : (
          <>
            {/* Current Room */}
            <div className="p-3 bg-slate-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Current Room</span>
                <Badge variant="secondary" className={`${
                  currentRoom.status === 'playing' ? 'bg-orange-600' : 
                  currentRoom.status === 'waiting' ? 'bg-green-600' : 'bg-gray-600'
                }`}>
                  {currentRoom.status === 'playing' ? 'PLAYING' : 
                   currentRoom.status === 'waiting' ? 'WAITING' : 'ACTIVE'}
                </Badge>
              </div>
              <div className="text-sm text-gray-400">
                Room #{currentRoom.code}
              </div>
              <div className="text-sm text-gray-400">
                {currentRoom.name}
              </div>
            </div>

            {/* Room Actions */}
            <div className="space-y-2">
              {/* Main action buttons */}
              <div className="flex space-x-2">
                {/* Check if user is a player in the room */}
                {participants.some(p => p.userId === (user?.userId || user?.id) && p.role === 'player') ? (
                  <Button
                    onClick={() => {
                      console.log('🎮 Start game button clicked');
                      startGameMutation.mutate();
                    }}
                    disabled={startGameMutation.isPending || currentRoom.status === 'playing'}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {startGameMutation.isPending ? 'Starting...' : 
                     currentRoom.status === 'playing' ? 'Game Running' : 'Start Game'}
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="flex-1 bg-gray-600 cursor-not-allowed"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {currentRoom.status === 'playing' ? 'Game Running' : 'Wait for Start'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleLeaveRoom}
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Invite friends button (only for room owner) */}
              {currentRoom.ownerId === (user?.userId || user?.id) && (
                <Button
                  onClick={() => setShowInviteModal(true)}
                  variant="outline"
                  className="w-full border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Friends
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
      
      {/* Invite Friends Modal */}
      {currentRoom && (
        <InviteFriendsModal
          open={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          roomId={currentRoom.id}
          roomName={currentRoom.name}
        />
      )}
    </Card>
  );
}
