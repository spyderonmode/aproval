import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, UserPlus, UserCheck, UserX, Trophy, TrendingUp, Calendar, Loader2, MessageCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';

interface FriendRequest {
  id: string;
  requesterId: string;
  requestedId: string;
  status: string;
  sentAt: string;
  respondedAt: string | null;
  requester: User;
  requested: User;
}

interface HeadToHeadStats {
  totalGames: number;
  userWins: number;
  friendWins: number;
  draws: number;
  userWinRate: number;
  friendWinRate: number;
}

export function Friends() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [selectedChatFriend, setSelectedChatFriend] = useState<User | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Map<string, any[]>>(new Map());
  const [unreadMessages, setUnreadMessages] = useState<Map<string, number>>(new Map());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user data
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/user']
  });

  // Fetch friends list
  const { data: friends = [], isLoading: friendsLoading } = useQuery<User[]>({
    queryKey: ['/api/friends'],
    enabled: isOpen,
  });

  // Fetch friend requests
  const { data: friendRequests = [], isLoading: requestsLoading } = useQuery<FriendRequest[]>({
    queryKey: ['/api/friends/requests'],
    enabled: isOpen,
  });

  // Fetch head-to-head stats for selected friend
  const { data: headToHeadStats } = useQuery<HeadToHeadStats>({
    queryKey: ['/api/friends', selectedFriend?.id, 'stats'],
    enabled: !!selectedFriend,
  });

  // Send friend request mutation
  const sendFriendRequest = useMutation({
    mutationFn: async (requestedId: string) => {
      return await apiRequest('POST', '/api/friends/request', { requestedId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend request sent successfully",
      });
      setSearchName('');
      setSearchResults([]);
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive",
      });
    },
  });

  // Respond to friend request mutation
  const respondToFriendRequest = useMutation({
    mutationFn: async ({ requestId, response }: { requestId: string; response: 'accepted' | 'rejected' }) => {
      return await apiRequest('POST', '/api/friends/respond', { requestId, response });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend request responded to successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to respond to friend request",
        variant: "destructive",
      });
    },
  });

  // Remove friend mutation
  const removeFriend = useMutation({
    mutationFn: async (friendId: string) => {
      return await apiRequest('DELETE', `/api/friends/${friendId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      setSelectedFriend(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove friend",
        variant: "destructive",
      });
    },
  });

  // State for search results
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Chat functionality
  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, message }: { receiverId: string; message: string }) => {
      return await apiRequest('POST', '/api/messages/send', { receiverId, message });
    },
    onSuccess: (data, variables) => {
      if (selectedChatFriend) {
        // Add the sent message to chat history for this user
        const newMessage = {
          id: data.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          message: data.message,
          sentAt: data.sentAt,
          fromMe: true
        };
        
        setChatHistory(prev => {
          const newHistory = new Map(prev);
          const userMessages = newHistory.get(selectedChatFriend.id) || [];
          newHistory.set(selectedChatFriend.id, [...userMessages, newMessage]);
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

  // Load chat history for selected friend
  const { data: chatMessages = [] } = useQuery({
    queryKey: ['/api/messages', selectedChatFriend?.id],
    enabled: !!selectedChatFriend,
  });

  // Update chat history when chatMessages data changes
  useEffect(() => {
    if (selectedChatFriend && chatMessages.length > 0 && currentUser) {
      setChatHistory(prev => {
        const newHistory = new Map(prev);
        // Transform messages to the expected format
        const transformedMessages = chatMessages.map((msg: any) => ({
          ...msg,
          fromMe: msg.senderId === currentUser.userId
        }));
        newHistory.set(selectedChatFriend.id, transformedMessages);
        return newHistory;
      });
    }
  }, [selectedChatFriend, chatMessages, currentUser]);

  // Handle incoming chat messages
  useEffect(() => {
    const handleChatMessage = (event: CustomEvent) => {
      const data = event.detail;
      
      if (data.type === 'chat_message_received') {
        // Add to unread messages count if not viewing this friend's chat
        if (!isOpen || !selectedChatFriend || selectedChatFriend.id !== data.senderId) {
          setUnreadMessages(prev => {
            const newUnread = new Map(prev);
            const currentUnread = newUnread.get(data.senderId) || 0;
            newUnread.set(data.senderId, currentUnread + 1);
            return newUnread;
          });
          
          // If we're not viewing this friend's chat, just return
          if (!selectedChatFriend || selectedChatFriend.id !== data.senderId) {
            return;
          }
        }
        
        // Only handle messages from the currently selected friend
        if (selectedChatFriend && selectedChatFriend.id === data.senderId) {
          const incomingMessage = {
            id: data.messageId,
            senderId: data.senderId,
            receiverId: data.receiverId || currentUser?.userId,
            message: data.message,
            sentAt: data.timestamp,
            fromMe: false
          };
          
          // Add to chat history for this sender
          setChatHistory(prev => {
            const newHistory = new Map(prev);
            const userMessages = newHistory.get(data.senderId) || [];
            newHistory.set(data.senderId, [...userMessages, incomingMessage]);
            return newHistory;
          });
        }
      }
    };

    // Only listen for events when modal is open
    if (isOpen) {
      window.addEventListener('chat_message_received', handleChatMessage as EventListener);
      
      return () => {
        window.removeEventListener('chat_message_received', handleChatMessage as EventListener);
      };
    }
  }, [isOpen, selectedChatFriend, currentUser]);

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !selectedChatFriend) return;
    
    sendMessageMutation.mutate({ 
      receiverId: selectedChatFriend.id, 
      message: chatMessage.trim() 
    });
  };

  const startChatWithFriend = (friend: User) => {
    setSelectedChatFriend(friend);
    // Clear unread messages for this friend
    setUnreadMessages(prev => {
      const newUnread = new Map(prev);
      newUnread.delete(friend.id);
      return newUnread;
    });
  };

  // Get current chat messages for selected friend
  const currentChatMessages = selectedChatFriend ? chatHistory.get(selectedChatFriend.id) || [] : [];

  // Find users by name for friend requests
  const findUsersByName = async () => {
    if (!searchName.trim()) return;

    setIsSearching(true);
    try {
      const response = await apiRequest('POST', '/api/users/search', { name: searchName.trim() });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.users) {
        setSearchResults(data.users);
      } else {
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error("Friend search error:", error);
      toast({
        title: "Search Error",
        description: error.message || "Failed to search for users",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Users className="h-4 w-4 mr-2" />
          Friends
          {friendRequests.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {friendRequests.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Friends</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests 
              {friendRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {friendRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="add">Add Friend</TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends" className="space-y-4">
            {friendsLoading ? (
              <div className="text-center py-8">Loading friends...</div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No friends yet. Add some friends to get started!
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => setSelectedFriend(friend)}
                  >
                    <div className="flex items-center gap-3">
                      {friend.profileImageUrl ? (
                        <img
                          src={friend.profileImageUrl}
                          alt={friend.displayName || `${friend.firstName} ${friend.lastName || ''}`.trim()}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {friend.firstName?.[0] || '?'}{friend.lastName?.[0] || ''}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {friend.displayName || `${friend.firstName} ${friend.lastName || ''}`.trim()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {friend.wins}W-{friend.losses}L-{friend.draws}D
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          startChatWithFriend(friend);
                        }}
                        className="relative"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Chat
                        {unreadMessages.get(friend.id) && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {unreadMessages.get(friend.id)}
                          </span>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFriend.mutate(friend.id);
                        }}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="requests" className="space-y-4">
            {requestsLoading ? (
              <div className="text-center py-8">Loading requests...</div>
            ) : friendRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending friend requests
              </div>
            ) : (
              <div className="space-y-2">
                {friendRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {request.requester.profileImageUrl ? (
                        <img
                          src={request.requester.profileImageUrl}
                          alt={request.requester.displayName || `${request.requester.firstName} ${request.requester.lastName || ''}`.trim()}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {request.requester.firstName?.[0] || '?'}{request.requester.lastName?.[0] || ''}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {request.requester.displayName || `${request.requester.firstName} ${request.requester.lastName || ''}`.trim()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Sent on {formatDate(request.sentAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => respondToFriendRequest.mutate({ requestId: request.id, response: 'accepted' })}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => respondToFriendRequest.mutate({ requestId: request.id, response: 'rejected' })}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="add" className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Find friend by name
              </label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter name to search"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      findUsersByName();
                    }
                  }}
                />
                <Button
                  onClick={findUsersByName}
                  disabled={!searchName.trim() || isSearching}
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Search Results:</div>
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      {user.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt={user.displayName || `${user.firstName} ${user.lastName || ''}`.trim()}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {user.firstName?.[0] || '?'}{user.lastName?.[0] || ''}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {user.displayName || `${user.firstName} ${user.lastName || ''}`.trim()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.wins}W-{user.losses}L-{user.draws}D
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendFriendRequest.mutate(user.id)}
                      disabled={sendFriendRequest.isPending}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Head-to-head stats modal */}
        {selectedFriend && (
          <Dialog open={!!selectedFriend} onOpenChange={() => setSelectedFriend(null)}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  Head-to-Head with {selectedFriend.displayName || `${selectedFriend.firstName} ${selectedFriend.lastName || ''}`.trim()}
                </DialogTitle>
              </DialogHeader>
              
              {headToHeadStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {headToHeadStats.userWins}
                      </div>
                      <div className="text-sm text-muted-foreground">Your Wins</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {headToHeadStats.friendWins}
                      </div>
                      <div className="text-sm text-muted-foreground">Their Wins</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-lg font-bold">
                        {headToHeadStats.totalGames}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Games</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-lg font-bold">
                        {headToHeadStats.draws}
                      </div>
                      <div className="text-sm text-muted-foreground">Draws</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-lg font-bold">
                        {headToHeadStats.userWinRate}%
                      </div>
                      <div className="text-sm text-muted-foreground">Your Win Rate</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">Loading stats...</div>
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* Chat modal */}
        {selectedChatFriend && (
          <Dialog open={!!selectedChatFriend} onOpenChange={() => setSelectedChatFriend(null)}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedChatFriend(null)}
                  >
                    ← Back
                  </Button>
                  <div className="flex items-center gap-3">
                    {selectedChatFriend.profileImageUrl ? (
                      <img
                        src={selectedChatFriend.profileImageUrl}
                        alt={selectedChatFriend.displayName || `${selectedChatFriend.firstName} ${selectedChatFriend.lastName || ''}`.trim()}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {selectedChatFriend.firstName?.[0] || '?'}{selectedChatFriend.lastName?.[0] || ''}
                      </div>
                    )}
                    <span className="font-medium">
                      Chat with {selectedChatFriend.displayName || `${selectedChatFriend.firstName} ${selectedChatFriend.lastName || ''}`.trim()}
                    </span>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <ScrollArea className="h-[300px] w-full">
                  <div className="space-y-2">
                    {currentChatMessages.length > 0 ? (
                      currentChatMessages.map((msg, index) => (
                        <div key={msg.id || index} className={`p-2 rounded-lg ${msg.fromMe ? 'bg-blue-100 dark:bg-blue-900 ml-4' : 'bg-gray-100 dark:bg-gray-800 mr-4'}`}>
                          <div className="text-sm font-medium">{msg.fromMe ? 'You' : selectedChatFriend.displayName || selectedChatFriend.firstName || selectedChatFriend.username}</div>
                          <div className="text-sm">{msg.message}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(msg.sentAt || msg.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No messages yet. Start a conversation with your friend!
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
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}