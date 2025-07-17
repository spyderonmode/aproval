import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, X, Minimize2, Maximize2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  fromMe: boolean;
}

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  initialSender?: {
    userId: string;
    displayName: string;
    username: string;
  };
  initialMessage?: string;
}

export function ChatPopup({ 
  isOpen, 
  onClose, 
  currentUser, 
  initialSender, 
  initialMessage 
}: ChatPopupProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(initialSender || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add initial message if provided
  useEffect(() => {
    if (initialMessage && initialSender) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        senderId: initialSender.userId,
        senderName: initialSender.displayName || initialSender.username,
        message: initialMessage,
        timestamp: new Date().toLocaleTimeString(),
        fromMe: false
      };
      setMessages([message]);
      setActiveChatUser(initialSender);
    }
  }, [initialMessage, initialSender]);

  // Handle additional incoming messages from WebSocket (only for continuation of existing chat)
  useEffect(() => {
    const handleChatMessage = (event: CustomEvent) => {
      const data = event.detail;
      
      if (data.type === 'chat_message_received' && activeChatUser && isOpen) {
        // Only add message if it's from the current active chat user
        // and it's not the initial message (which comes through props)
        if (activeChatUser.userId === data.message.senderId) {
          const incomingMessage: ChatMessage = {
            id: Date.now().toString(),
            senderId: data.message.senderId,
            senderName: data.message.senderName,
            message: data.message.message,
            timestamp: new Date(data.message.timestamp).toLocaleTimeString(),
            fromMe: false
          };
          
          // Only add if it's not the initial message that triggered the popup
          if (data.message.message !== initialMessage) {
            setMessages(prev => [...prev, incomingMessage]);
          }
        }
      }
    };

    // Only listen if popup is open and we have an active chat user
    if (isOpen && activeChatUser) {
      window.addEventListener('chat_message_received', handleChatMessage as EventListener);
      
      return () => {
        window.removeEventListener('chat_message_received', handleChatMessage as EventListener);
      };
    }
  }, [activeChatUser, isOpen, initialMessage]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ targetUserId, message }: { targetUserId: string; message: string }) => {
      return await apiRequest('POST', '/api/chat/send', { targetUserId, message });
    },
    onSuccess: () => {
      if (activeChatUser) {
        // Add the sent message to chat
        const sentMessage: ChatMessage = {
          id: Date.now().toString(),
          senderId: currentUser?.userId || currentUser?.id,
          senderName: currentUser?.displayName || currentUser?.firstName || 'You',
          message: newMessage,
          timestamp: new Date().toLocaleTimeString(),
          fromMe: true
        };
        
        setMessages(prev => [...prev, sentMessage]);
      }
      setNewMessage('');
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

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeChatUser) return;
    
    sendMessageMutation.mutate({ 
      targetUserId: activeChatUser.userId, 
      message: newMessage.trim() 
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    setMessages([]);
    setActiveChatUser(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-80 max-w-sm"
          >
            <Card className="shadow-xl border-2 border-blue-200 dark:border-blue-700">
              <CardHeader className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    {activeChatUser ? (
                      <span className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {activeChatUser.displayName || activeChatUser.username}
                      </span>
                    ) : (
                      'Chat'
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="h-6 w-6 p-0 text-white hover:bg-white/20"
                    >
                      {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClose}
                      className="h-6 w-6 p-0 text-white hover:bg-white/20"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {!isMinimized && (
                <CardContent className="p-0">
                  <div className="h-64 flex flex-col">
                    <ScrollArea className="flex-1 p-3">
                      <div className="space-y-2">
                        {messages.length === 0 ? (
                          <div className="text-center text-gray-500 text-sm py-8">
                            No messages yet. Start a conversation!
                          </div>
                        ) : (
                          messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                                  message.fromMe
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                }`}
                              >
                                <div className="font-medium text-xs opacity-70 mb-1">
                                  {message.fromMe ? 'You' : message.senderName}
                                </div>
                                <div>{message.message}</div>
                                <div className="text-xs opacity-70 mt-1">
                                  {message.timestamp}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                    
                    <div className="p-3 border-t bg-gray-50 dark:bg-gray-800">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="flex-1 text-sm"
                          disabled={!activeChatUser || sendMessageMutation.isPending}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || !activeChatUser || sendMessageMutation.isPending}
                          size="sm"
                          className="px-3"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}