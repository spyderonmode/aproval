import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  console.log('📨 ChatProvider: Initializing with currentUser:', currentUser);
  
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentSender, setCurrentSender] = useState<{
    userId: string;
    displayName: string;
    username: string;
  } | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string>('');

  const showChatPopup = useCallback((sender: { userId: string; displayName: string; username: string }, message: string) => {
    console.log('📨 ChatContext: showChatPopup called with sender:', sender, 'message:', message);
    setCurrentSender(sender);
    setCurrentMessage(message);
    setIsPopupOpen(true);
    console.log('📨 ChatContext: Popup state set to open, isPopupOpen:', true);
  }, []);

  // Listen for incoming chat messages
  useEffect(() => {
    console.log('📨 ChatProvider: useEffect initializing - currentUser:', currentUser);
    const handleChatMessage = (event: CustomEvent) => {
      console.log('📨 ChatContext: Event listener triggered with event:', event);
      const data = event.detail;
      console.log('📨 ChatContext: Event detail:', data);
      
      if (data && data.type === 'chat_message_received') {
        console.log('📨 ChatContext: Processing chat message:', data.message);
        const sender = {
          userId: data.message.senderId,
          displayName: data.message.senderName,
          username: data.message.senderName
        };
        
        console.log('📨 ChatContext: Calling showChatPopup with sender:', sender, 'message:', data.message.message);
        // Show popup with the new message
        showChatPopup(sender, data.message.message);
      } else {
        console.log('📨 ChatContext: Event data is not chat_message_received type:', data);
      }
    };

    console.log('📨 ChatContext: Setting up event listener for chat_message_received');
    // Listen for WebSocket messages
    window.addEventListener('chat_message_received', handleChatMessage as EventListener);
    
    return () => {
      console.log('📨 ChatContext: Removing event listener');
      window.removeEventListener('chat_message_received', handleChatMessage as EventListener);
    };
  }, [showChatPopup]);

  // Add test function for debugging
  (window as any).testChatPopup = () => {
    console.log('🧪 Testing chat popup directly');
    showChatPopup(
      { userId: 'test123', displayName: 'Test User', username: 'testuser' },
      'Test message from test function'
    );
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
        initialSender={currentSender || undefined}
        initialMessage={currentMessage}
      />
    </ChatContext.Provider>
  );
}