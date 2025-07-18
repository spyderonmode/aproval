import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Clock, Users, UserX, UserCheck, Eye } from "lucide-react";
import { UserProfileModal } from "./UserProfileModal";

interface OnlineUsersModalProps {
  open: boolean;
  onClose: () => void;
  currentRoom?: any;
  user?: any;
}

export function OnlineUsersModal({ open, onClose, currentRoom, user }: OnlineUsersModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [profileUser, setProfileUser] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const { data: onlineUsers, isLoading } = useQuery({
    queryKey: ["/api/users/online"],
    refetchInterval: 5000, // Refresh every 5 seconds
    enabled: open,
  });

  // Fetch blocked users
  const { data: blockedUsersData } = useQuery({
    queryKey: ["/api/users/blocked"],
    enabled: open,
  });

  // Update blocked users state when data changes
  useEffect(() => {
    if (blockedUsersData) {
      setBlockedUsers(new Set(blockedUsersData.map((blocked: any) => blocked.blockedId)));
    }
  }, [blockedUsersData]);



  const blockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('/api/users/block', {
        method: 'POST',
        body: { userId },
      });
    },
    onSuccess: (_, userId) => {
      setBlockedUsers(prev => new Set(prev).add(userId));
      queryClient.invalidateQueries({ queryKey: ["/api/users/blocked"] });
      toast({
        title: "User blocked",
        description: "User has been blocked successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to block user",
        variant: "destructive",
      });
    },
  });

  const unblockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('/api/users/unblock', {
        method: 'POST',
        body: { userId },
      });
    },
    onSuccess: (_, userId) => {
      setBlockedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/blocked"] });
      toast({
        title: "User unblocked",
        description: "User has been unblocked successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unblock user",
        variant: "destructive",
      });
    },
  });





  const handleBlockUser = (userId: string) => {
    blockUserMutation.mutate(userId);
  };

  const handleUnblockUser = (userId: string) => {
    unblockUserMutation.mutate(userId);
  };



  const handleViewProfile = (user: any) => {
    setProfileUser(user);
    setShowProfileModal(true);
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
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Online Players:</strong> View player profiles and manage interactions.
            </p>
          </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <ScrollArea className="h-[400px] w-full">
                  <div className="space-y-2">
                    {onlineUsers?.users?.length > 0 ? (
                      onlineUsers.users.map((user: any) => {
                        const isBlocked = blockedUsers.has(user.userId);
                        return (
                          <Card key={user.userId} className={`p-3 cursor-pointer transition-colors ${isBlocked ? 'opacity-50 border-red-200 dark:border-red-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                            <div className="space-y-2">
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
                                    <h3 className="font-medium flex items-center gap-2">
                                      {user.displayName || user.firstName || user.username}
                                      {isBlocked && (
                                        <Badge variant="destructive" className="text-xs">
                                          Blocked
                                        </Badge>
                                      )}
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
                                    onClick={() => handleViewProfile(user)}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Profile
                                  </Button>
                                  
                                  {isBlocked ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleUnblockUser(user.userId)}
                                      disabled={unblockUserMutation.isPending}
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <UserCheck className="h-4 w-4 mr-1" />
                                      Unblock
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleBlockUser(user.userId)}
                                      disabled={blockUserMutation.isPending}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <UserX className="h-4 w-4 mr-1" />
                                      Block
                                    </Button>
                                  )}
                                </div>
                              </div>
                              
                              {user.achievements && user.achievements.length > 0 && (
                                <div className="flex items-center gap-1 pl-13">
                                  {user.achievements.map((achievement: any) => (
                                    <span
                                      key={achievement.id}
                                      className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full flex items-center gap-1"
                                      title={achievement.description}
                                    >
                                      {achievement.icon}
                                      <span className="font-medium">{achievement.achievementName}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      })
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
      
      {/* Profile Modal */}
      {profileUser && (
        <UserProfileModal
          open={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userId={profileUser.userId}
          username={profileUser.username}
          displayName={profileUser.displayName || profileUser.firstName || profileUser.username}
          profilePicture={profileUser.profilePicture}
          profileImageUrl={profileUser.profileImageUrl}
        />
      )}
    </Dialog>
  );
}