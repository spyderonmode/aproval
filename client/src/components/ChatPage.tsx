import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Users, UserPlus, Search } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

interface ChatMessage {
  id: string;
  fromUserId: string;
  fromUser: string;
  message: string;
  timestamp: string;
  toUserId?: string;
}

interface OnlineUser {
  userId: string;
  username: string;
  displayName?: string;
  isOnline: boolean;
}

export function ChatPage() {
  const [selectedUser, setSelectedUser] = useState<OnlineUser | null>(null);
  const [messageText, setMessageText] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { sendMessage, lastMessage } = useWebSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: onlineUsers = [] } = useQuery({
    queryKey: ["/api/users/online"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Filter users based on search
  const filteredUsers = onlineUsers.filter((u: OnlineUser) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.displayName && u.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle incoming chat messages
  useEffect(() => {
    if (lastMessage?.type === 'chat_message_received') {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        fromUserId: lastMessage.fromUserId,
        fromUser: lastMessage.fromUser,
        message: lastMessage.message,
        timestamp: new Date().toLocaleTimeString(),
        toUserId: lastMessage.toUserId
      };

      // Only show messages relevant to current conversation
      if (selectedUser && 
          (newMessage.fromUserId === selectedUser.userId || 
           newMessage.toUserId === selectedUser.userId ||
           newMessage.fromUserId === (user?.userId || user?.id))) {
        setChatMessages(prev => [...prev, newMessage]);
      }
    }
  }, [lastMessage, selectedUser, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Listen for external user selection events
  useEffect(() => {
    const handleSelectUser = (event: any) => {
      const user = event.detail;
      setSelectedUser(user);
    };

    window.addEventListener('selectChatUser', handleSelectUser);
    return () => window.removeEventListener('selectChatUser', handleSelectUser);
  }, []);

  // Load chat history when selecting a user
  useEffect(() => {
    if (selectedUser) {
      // Clear current messages and load history for this user
      setChatMessages([]);
      // You could implement chat history loading here
    }
  }, [selectedUser]);

  const handleSendMessage = () => {
    if (messageText.trim() && selectedUser) {
      const message = {
        type: 'send_chat_message',
        toUserId: selectedUser.userId,
        message: messageText.trim(),
        fromUser: user?.displayName || user?.firstName || user?.username || 'Player'
      };

      sendMessage(message);

      // Add to local messages immediately for instant feedback
      const localMessage: ChatMessage = {
        id: Date.now().toString(),
        fromUserId: user?.userId || user?.id || '',
        fromUser: user?.displayName || user?.firstName || user?.username || 'You',
        message: messageText.trim(),
        timestamp: new Date().toLocaleTimeString(),
        toUserId: selectedUser.userId
      };

      setChatMessages(prev => [...prev, localMessage]);
      setMessageText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] p-4">
      <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Users List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Online Players</span>
              <Badge variant="secondary" className="bg-green-600/20 text-green-400">
                {filteredUsers.length}
              </Badge>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="space-y-1 p-3">
                {filteredUsers.map((onlineUser: OnlineUser) => (
                  <Button
                    key={onlineUser.userId}
                    variant={selectedUser?.userId === onlineUser.userId ? "default" : "ghost"}
                    className={`w-full justify-start h-auto p-3 ${
                      selectedUser?.userId === onlineUser.userId
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-slate-700 text-slate-300'
                    }`}
                    onClick={() => setSelectedUser(onlineUser)}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">
                          {(onlineUser.displayName || onlineUser.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium truncate">
                          {onlineUser.displayName || onlineUser.username}
                        </p>
                        <p className="text-xs opacity-75">
                          {onlineUser.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        onlineUser.isOnline ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                    </div>
                  </Button>
                ))}
                
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No players found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <div className="lg:col-span-2 flex flex-col">
          {selectedUser ? (
            <Card className="bg-slate-800 border-slate-700 flex-1 flex flex-col">
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b border-slate-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="font-bold text-white">
                      {(selectedUser.displayName || selectedUser.username).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {selectedUser.displayName || selectedUser.username}
                    </CardTitle>
                    <p className="text-sm text-slate-400">
                      {selectedUser.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-0 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatMessages.length > 0 ? (
                      chatMessages.map((msg) => {
                        const isFromMe = msg.fromUserId === (user?.userId || user?.id);
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                isFromMe
                                  ? 'bg-primary text-primary-foreground ml-4'
                                  : 'bg-slate-700 text-white mr-4'
                              }`}
                            >
                              <p className="text-sm">{msg.message}</p>
                              <p className="text-xs opacity-75 mt-1">{msg.timestamp}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Start a conversation with {selectedUser.displayName || selectedUser.username}!</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-slate-700">
                  <div className="flex space-x-2">
                    <Input
                      placeholder={`Message ${selectedUser.displayName || selectedUser.username}...`}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      size="sm"
                      className="px-4"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-800 border-slate-700 flex-1 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Choose a player to chat</h3>
                <p>Select a player from the list to start a conversation</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}