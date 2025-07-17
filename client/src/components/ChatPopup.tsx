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
import { useChatContext } from '@/contexts/ChatContext';

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
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(initialSender || null);

  // ChatPopup is now just a notification - doesn't show chat history
  // Chat history is only shown in OnlineUsersModal

  // No need for auto-scroll since we're not showing chat history
  // ChatPopup is now just a notification popup

  // Set active chat user from initial sender
  useEffect(() => {
    if (initialSender) {
      setActiveChatUser(initialSender);
    }
  }, [initialSender]);

  // ChatPopup is now just a notification popup - no chat functionality

  const handleClose = () => {
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
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 mx-auto mb-3">
                      <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      New message from {activeChatUser?.displayName || activeChatUser?.username}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {initialMessage}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Open chat to view full conversation
                    </div>
                    <Button
                      onClick={handleClose}
                      size="sm"
                      className="w-full"
                    >
                      Dismiss
                    </Button>
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