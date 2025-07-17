import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, MessageCircle, Clock, Users, Send, UserX, UserCheck, Eye } from "lucide-react";
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
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Map<string, any[]>>(new Map());
  const [unreadMessages, setUnreadMessages] = useState<Map<string, number>>(new Map());
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

  const sendMessageMutation = useMutation({
    mutationFn: async ({ targetUserId, message }: { targetUserId: string; message: string }) => {
      return await apiRequest('POST', '/api/chat/send', { targetUserId, message });
    },
    onSuccess: () => {
      if (selectedUser) {
        // Add the sent message to chat history for this user
        const newMessage = {
          fromMe: true,
          message: chatMessage,
          timestamp: new Date().toLocaleTimeString(),
          userId: user?.userId || user?.id
        };
        
        setChatHistory(prev => {
          const newHistory = new Map(prev);
          const userMessages = newHistory.get(selectedUser.userId) || [];
          newHistory.set(selectedUser.userId, [...userMessages, newMessage]);
          return newHistory;
        });
      }
      setChatMessage("");
    },
    onError: (error: any) => {
      console.error('Chat message error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('POST', '/api/users/block', { userId });
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
      return await apiRequest('POST', '/api/users/unblock', { userId });
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

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !selectedUser) return;
    
    sendMessageMutation.mutate({ 
      targetUserId: selectedUser.userId, 
      message: chatMessage.trim() 
    });
  };

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

  // Handle incoming chat messages and user offline events
  useEffect(() => {
    const handleChatMessage = (event: CustomEvent) => {
      const data = event.detail;
      
      if (data.type === 'chat_message_received') {
        // Check if sender is blocked
        if (blockedUsers.has(data.message.senderId)) {
          return; // Ignore messages from blocked users
        }
        
        const incomingMessage = {
          fromMe: false,
          message: data.message.message,
          timestamp: new Date(data.message.timestamp).toLocaleTimeString(),
          userId: data.message.senderId,
          senderName: data.message.senderName
        };
        
        // Add to chat history for this sender
        setChatHistory(prev => {
          const newHistory = new Map(prev);
          const userMessages = newHistory.get(data.message.senderId) || [];
          newHistory.set(data.message.senderId, [...userMessages, incomingMessage]);
          return newHistory;
        });
        
        // Add to unread messages count if not currently chatting with this user
        if (!selectedUser || selectedUser.userId !== data.message.senderId) {
          setUnreadMessages(prev => {
            const newUnread = new Map(prev);
            const currentCount = newUnread.get(data.message.senderId) || 0;
            newUnread.set(data.message.senderId, currentCount + 1);
            return newUnread;
          });
        }
      }
    };

    const handleUserOffline = (event: CustomEvent) => {
      const data = event.detail;
      
      if (data.type === 'user_offline') {
        // Remove chat history for offline user
        setChatHistory(prev => {
          const newHistory = new Map(prev);
          newHistory.delete(data.userId);
          return newHistory;
        });
        
        // Remove unread messages for offline user
        setUnreadMessages(prev => {
          const newUnread = new Map(prev);
          newUnread.delete(data.userId);
          return newUnread;
        });
        
        // If we're currently chatting with this user, go back to user list
        if (selectedUser && selectedUser.userId === data.userId) {
          setSelectedUser(null);
        }
      }
    };

    // Listen for chat messages and user offline events
    window.addEventListener('chat_message_received', handleChatMessage as EventListener);
    window.addEventListener('user_offline', handleUserOffline as EventListener);
    
    return () => {
      window.removeEventListener('chat_message_received', handleChatMessage as EventListener);
      window.removeEventListener('user_offline', handleUserOffline as EventListener);
    };
  }, [selectedUser]);

  // Get current chat messages for selected user
  const currentChatMessages = selectedUser ? chatHistory.get(selectedUser.userId) || [] : [];

  // Function to start chat with a user and clear unread messages
  const startChatWithUser = (user: any) => {
    setSelectedUser(user);
    // Clear unread messages for this user
    setUnreadMessages(prev => {
      const newUnread = new Map(prev);
      newUnread.delete(user.userId);
      return newUnread;
    });
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
          {!selectedUser ? (
            <>
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Online Players:</strong> Click on a player to start chatting with them.
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
                                      onClick={() => startChatWithUser(user)}
                                      className="relative"
                                    >
                                      <MessageCircle className="h-4 w-4 mr-1" />
                                      Chat
                                      {unreadMessages.get(user.userId) && (
                                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                          {unreadMessages.get(user.userId)}
                                        </span>
                                      )}
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
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedUser(null)}
                  >
                    ← Back
                  </Button>
                  <div className="flex items-center gap-3">
                    {selectedUser.profilePicture || selectedUser.profileImageUrl ? (
                      <img
                        src={selectedUser.profilePicture || selectedUser.profileImageUrl}
                        alt="Profile"
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <span className="font-medium">
                      {selectedUser.displayName || selectedUser.firstName || selectedUser.username}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {blockedUsers.has(selectedUser.userId) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnblockUser(selectedUser.userId)}
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
                      onClick={() => handleBlockUser(selectedUser.userId)}
                      disabled={blockUserMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Block
                    </Button>
                  )}
                </div>
              </div>
              
              <ScrollArea className="h-[300px] w-full">
                <div className="space-y-2">
                  {currentChatMessages.length > 0 ? (
                    currentChatMessages.map((msg, index) => (
                      <div key={index} className={`p-2 rounded-lg ${msg.fromMe ? 'bg-blue-100 dark:bg-blue-900 ml-4' : 'bg-gray-100 dark:bg-gray-800 mr-4'}`}>
                        <div className="text-sm font-medium">{msg.fromMe ? 'You' : selectedUser.displayName || selectedUser.username}</div>
                        <div className="text-sm">{msg.message}</div>
                        <div className="text-xs text-muted-foreground mt-1">{msg.timestamp}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No messages yet. Start a conversation!
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              {blockedUsers.has(selectedUser.userId) ? (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You have blocked this user. Unblock to send messages.
                  </p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!chatMessage.trim() || sendMessageMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
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