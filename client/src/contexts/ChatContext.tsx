import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChatPopup } from '@/components/ChatPopup';

interface ChatMessage {
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  fromMe: boolean;
}

interface ChatContextType {
  showChatPopup: (sender: { userId: string; displayName: string; username: string }, message: string) => void;
  closeChatPopup: () => void;
  isPopupOpen: boolean;
  chatHistory: Map<string, ChatMessage[]>;
  addToHistory: (userId: string, message: ChatMessage) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
  currentUser: any;
}

export function ChatProvider({ children, currentUser }: ChatProviderProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentSender, setCurrentSender] = useState<{
    userId: string;
    displayName: string;
    username: string;
  } | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Map<string, ChatMessage[]>>(new Map());

  // Listen for incoming chat messages
  useEffect(() => {
    const handleChatMessage = (event: CustomEvent) => {
      const data = event.detail;
      
      if (data.type === 'chat_message_received') {
        const sender = {
          userId: data.message.senderId,
          displayName: data.message.senderName,
          username: data.message.senderName
        };
        
        // Create message object
        const message: ChatMessage = {
          senderId: data.message.senderId,
          senderName: data.message.senderName,
          message: data.message.message,
          timestamp: new Date(data.message.timestamp).toLocaleTimeString(),
          fromMe: data.message.senderId === (currentUser?.userId || currentUser?.id)
        };
        
        // Add to chat history for the conversation partner
        // If it's from me, add to history with the target user
        // If it's from them, add to history with the sender
        const conversationPartnerId = message.fromMe 
          ? data.message.targetUserId || data.message.senderId // Use target if available, fallback to sender
          : data.message.senderId;
        
        addToHistory(conversationPartnerId, message);
        
        // Only show popup for messages from other users (not from current user)
        if (!message.fromMe) {
          showChatPopup(sender, data.message.message);
        }
      }
    };

    // Listen for WebSocket messages
    window.addEventListener('chat_message_received', handleChatMessage as EventListener);
    
    return () => {
      window.removeEventListener('chat_message_received', handleChatMessage as EventListener);
    };
  }, []);

  const addToHistory = (userId: string, message: ChatMessage) => {
    setChatHistory(prev => {
      const newHistory = new Map(prev);
      const userMessages = newHistory.get(userId) || [];
      newHistory.set(userId, [...userMessages, message]);
      return newHistory;
    });
  };

  const showChatPopup = (sender: { userId: string; displayName: string; username: string }, message: string) => {
    setCurrentSender(sender);
    setCurrentMessage(message);
    setIsPopupOpen(true);
  };

  const closeChatPopup = () => {
    setIsPopupOpen(false);
    setCurrentSender(null);
    setCurrentMessage('');
  };

  return (
    <ChatContext.Provider value={{ showChatPopup, closeChatPopup, isPopupOpen, chatHistory, addToHistory }}>
      {children}
      <ChatPopup
        isOpen={isPopupOpen}
        onClose={closeChatPopup}
        currentUser={currentUser}
        initialSender={currentSender}
        initialMessage={currentMessage}
      />
    </ChatContext.Provider>
  );
}