import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, UserPlus, Clock, Users } from "lucide-react";

interface OnlineUsersModalProps {
  open: boolean;
  onClose: () => void;
  currentRoom?: any;
}

export function OnlineUsersModal({ open, onClose, currentRoom }: OnlineUsersModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: onlineUsers, isLoading } = useQuery({
    queryKey: ["/api/users/online"],
    refetchInterval: 5000, // Refresh every 5 seconds
    enabled: open,
  });

  // Debug logging
  React.useEffect(() => {
    if (open) {
      console.log('🔍 OnlineUsersModal - currentRoom:', currentRoom);
      console.log('🔍 OnlineUsersModal - onlineUsers:', onlineUsers);
    }
  }, [open, currentRoom, onlineUsers]);

  const inviteMutation = useMutation({
    mutationFn: async ({ targetUserId, roomId }: { targetUserId: string; roomId: string }) => {
      return await apiRequest('/api/invitations/send', {
        method: 'POST',
        body: { targetUserId, roomId }
      });
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "The player has been invited to your room.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const handleInvite = (targetUserId: string) => {
    console.log('🔍 handleInvite called:', { targetUserId, currentRoom });
    
    if (!currentRoom) {
      toast({
        title: "Error",
        description: "You must be in a room to send invitations",
        variant: "destructive",
      });
      return;
    }

    console.log('🔍 Sending invitation to:', targetUserId, 'for room:', currentRoom.id);
    inviteMutation.mutate({ targetUserId, roomId: currentRoom.id });
  };

  const formatLastSeen = (lastSeen: string) => {
    const diff = Date.now() - new Date(lastSeen).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Online Players ({onlineUsers?.total || 0})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!currentRoom ? (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>To invite players:</strong> First create or join a room using the "Create Room" button or by entering a room code. Once you're in a room, you can invite other players to join your game.
              </p>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Room:</strong> {currentRoom.name} ({currentRoom.code}) - You can now invite players to your room!
              </p>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ScrollArea className="h-[400px] w-full">
              <div className="space-y-2">
                {onlineUsers?.users?.length > 0 ? (
                  onlineUsers.users.map((user: any) => (
                    <Card key={user.userId} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {user.profilePicture || user.profileImageUrl ? (
                            <img
                              src={user.profilePicture || user.profileImageUrl}
                              alt="Profile"
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium">
                              {user.displayName || user.firstName || user.username}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatLastSeen(user.lastSeen)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {user.inRoom && (
                            <Badge variant="secondary">In Room</Badge>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInvite(user.userId)}
                            disabled={inviteMutation.isPending || user.inRoom || !currentRoom}
                            title={!currentRoom ? "You must be in a room to send invitations" : user.inRoom ? "User is already in a room" : "Invite to your room"}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            {user.inRoom ? "In Room" : "Invite"}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No other players online
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}