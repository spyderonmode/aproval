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
import { User, MessageCircle, Clock, Users, Send } from "lucide-react";

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
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  const { data: onlineUsers, isLoading } = useQuery({
    queryKey: ["/api/users/online"],
    refetchInterval: 5000, // Refresh every 5 seconds
    enabled: open,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ targetUserId, message }: { targetUserId: string; message: string }) => {
      return await apiRequest('/api/chat/send', {
        method: 'POST',
        body: { targetUserId, message }
      });
    },
    onSuccess: () => {
      // Add the sent message to local chat
      const newMessage = {
        fromMe: true,
        message: chatMessage,
        timestamp: new Date().toLocaleTimeString(),
        userId: user?.userId || user?.id
      };
      setChatMessages(prev => [...prev, newMessage]);
      setChatMessage("");
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
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

  // Handle incoming chat messages
  useEffect(() => {
    const handleMessage = (event: any) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'chat_message_received') {
        const incomingMessage = {
          fromMe: false,
          message: data.message.message,
          timestamp: new Date(data.message.timestamp).toLocaleTimeString(),
          userId: data.message.senderId,
          senderName: data.message.senderName
        };
        
        setChatMessages(prev => [...prev, incomingMessage]);
        
        // Show toast notification if not currently chatting with this user
        if (!selectedUser || selectedUser.userId !== data.message.senderId) {
          toast({
            title: "New message",
            description: `${data.message.senderName}: ${data.message.message}`,
          });
        }
      }
    };

    // Add WebSocket listener if available
    if (window.WebSocket && open) {
      // This would need to be connected to the existing WebSocket in the home component
      // For now, we'll handle it through the parent component
    }
  }, [selectedUser, open, toast]);

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
                      onlineUsers.users.map((user: any) => (
                        <Card key={user.userId} className="p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
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
                                onClick={() => setSelectedUser(user)}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                Chat
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
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b">
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
              
              <ScrollArea className="h-[300px] w-full">
                <div className="space-y-2">
                  {chatMessages.length > 0 ? (
                    chatMessages.map((msg, index) => (
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}