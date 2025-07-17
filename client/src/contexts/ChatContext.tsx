import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChatPopup } from '@/components/ChatPopup';

interface ChatMessage {
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

interface ChatContextType {
  showChatPopup: (sender: { userId: string; displayName: string; username: string }, message: string) => void;
  closeChatPopup: () => void;
  isPopupOpen: boolean;
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

  // Listen for incoming chat messages
  useEffect(() => {
    const handleChatMessage = (event: CustomEvent) => {
      console.log('🔔 ChatProvider received chat event:', event.detail);
      const data = event.detail;
      
      if (data.type === 'chat_message_received') {
        console.log('🔔 Processing chat message for popup:', data.message);
        const sender = {
          userId: data.message.senderId,
          displayName: data.message.senderName,
          username: data.message.senderName
        };
        
        // Show popup with the new message
        showChatPopup(sender, data.message.message);
      }
    };

    // Listen for WebSocket messages
    window.addEventListener('chat_message_received', handleChatMessage as EventListener);
    
    return () => {
      window.removeEventListener('chat_message_received', handleChatMessage as EventListener);
    };
  }, []);

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
    <ChatContext.Provider value={{ showChatPopup, closeChatPopup, isPopupOpen }}>
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