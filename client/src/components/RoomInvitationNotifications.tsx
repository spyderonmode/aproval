import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Home, Clock, Check, X, Users } from 'lucide-react';

interface RoomInvitationNotificationsProps {
  onRoomJoin?: (room: any) => void;
}

export function RoomInvitationNotifications({ onRoomJoin }: RoomInvitationNotificationsProps) {
  const [processedInvitations, setProcessedInvitations] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch room invitations
  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['/api/room-invitations'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Respond to invitation mutation
  const respondToInvitationMutation = useMutation({
    mutationFn: async ({ invitationId, response }: { invitationId: string; response: 'accepted' | 'rejected' }) => {
      const apiResponse = await apiRequest('POST', `/api/room-invitations/${invitationId}/respond`, {
        response,
      });
      return apiResponse.json();
    },
    onSuccess: (data, variables) => {
      setProcessedInvitations(prev => new Set([...prev, variables.invitationId]));
      
      if (variables.response === 'accepted') {
        toast({
          title: "Invitation Accepted",
          description: "You have joined the room successfully!",
        });
        
        // Notify parent component about room join
        if (onRoomJoin && data.room) {
          onRoomJoin(data.room);
        }
      } else {
        toast({
          title: "Invitation Declined",
          description: "You declined the room invitation.",
        });
      }
      
      // Refresh invitations list
      queryClient.invalidateQueries({ queryKey: ['/api/room-invitations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to respond to invitation",
        variant: "destructive",
      });
    },
  });

  const handleAcceptInvitation = (invitationId: string) => {
    respondToInvitationMutation.mutate({ invitationId, response: 'accepted' });
  };

  const handleDeclineInvitation = (invitationId: string) => {
    respondToInvitationMutation.mutate({ invitationId, response: 'rejected' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Filter out processed invitations
  const activeInvitations = invitations.filter((inv: any) => !processedInvitations.has(inv.id));

  if (isLoading || activeInvitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {activeInvitations.map((invitation: any) => (
        <Card key={invitation.id} className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Home className="h-4 w-4 text-blue-600" />
              Room Invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium text-sm">
                {invitation.inviter.displayName || invitation.inviter.username}
              </p>
              <p className="text-sm text-muted-foreground">
                invited you to join "{invitation.room.name}"
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  Room #{invitation.room.code}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  Max {invitation.room.maxPlayers} players
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatTime(invitation.invitedAt)}
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAcceptInvitation(invitation.id)}
                disabled={respondToInvitationMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4 mr-1" />
                {respondToInvitationMutation.isPending ? "Joining..." : "Accept"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeclineInvitation(invitation.id)}
                disabled={respondToInvitationMutation.isPending}
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <X className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}