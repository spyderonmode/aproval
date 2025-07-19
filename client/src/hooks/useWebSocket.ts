import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

// Global WebSocket instance to prevent duplicates
let globalWebSocket: WebSocket | null = null;
let globalConnectionState = false;
let globalUserId: string | null = null;

export function useWebSocket() {
  const { user } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const joinedRooms = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    
    const currentUserId = user.userId || user.id;
    
    // Use global WebSocket if it exists and is for the same user
    if (globalWebSocket && globalUserId === currentUserId && globalWebSocket.readyState !== WebSocket.CLOSED) {
      console.log('🔌 Reusing existing global WebSocket connection for user:', currentUserId);
      ws.current = globalWebSocket;
      setIsConnected(globalConnectionState);
      return;
    }
    
    // Close any existing global connection for different user
    if (globalWebSocket && globalUserId !== currentUserId) {
      console.log('🔌 Closing existing WebSocket for different user');
      globalWebSocket.close();
      globalWebSocket = null;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('🔌 Creating new global WebSocket connection for user:', currentUserId);
    globalWebSocket = new WebSocket(wsUrl);
    globalUserId = currentUserId;
    ws.current = globalWebSocket;

    ws.current.onopen = () => {
      console.log('🔌 Global WebSocket connected');
      globalConnectionState = true;
      setIsConnected(true);
      // Clear joined rooms on reconnect to prevent duplicates
      joinedRooms.current.clear();
      // Authenticate with WebSocket
      const authMessage = {
        type: 'auth',
        userId: user.userId || user.id,
      };
      console.log('🔐 Sending auth message:', authMessage);
      ws.current?.send(JSON.stringify(authMessage));
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log(`📥 Received WebSocket message:`, message);
        console.log(`📥 Message type: ${message.type}`);
        if (message.type === 'move') {
          console.log(`📥 Move message - GameId: ${message.gameId}, Position: ${message.position}, Board:`, message.board);
        }
        if (message.type === 'game_started') {
          console.log(`📥 Game started message - RoomId: ${message.roomId}, GameId: ${message.game?.id}`);
          console.log(`📥 Game players - X: ${message.game?.playerXInfo?.displayName}, O: ${message.game?.playerOInfo?.displayName}`);
        }
        
        // Dispatch custom events for different message types
        if (message.type === 'chat_message_received') {
          const chatEvent = new CustomEvent('chat_message_received', {
            detail: message
          });
          window.dispatchEvent(chatEvent);
        }

        // Handle room invitation messages
        if (message.type === 'room_invitation') {
          console.log('📧 Received room invitation:', message.invitation);
          const invitationEvent = new CustomEvent('room_invitation_received', {
            detail: message.invitation
          });
          window.dispatchEvent(invitationEvent);
        }

        // Handle game abandonment due to player leaving
        if (message.type === 'game_abandoned') {
          console.log('🏠 Game abandoned - redirecting to home:', message.message);
          const gameAbandonedEvent = new CustomEvent('game_abandoned', {
            detail: message
          });
          window.dispatchEvent(gameAbandonedEvent);
        }
        
        setLastMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.current.onclose = (event) => {
      console.log('🔌 Global WebSocket connection closed:', event.code, event.reason);
      console.log('🔌 Close event details:', event);
      globalConnectionState = false;
      setIsConnected(false);
      // Clear global references when connection closes
      if (globalWebSocket === ws.current) {
        globalWebSocket = null;
        globalUserId = null;
      }
      // Don't clear game state on connection close to prevent white screen
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      console.log('🔌 Cleaning up WebSocket hook reference');
      // Only clear local reference, don't close global connection
      // unless it's specifically for this user
      if (ws.current === globalWebSocket && globalUserId === currentUserId) {
        // Keep global connection alive for other potential hooks
        console.log('🔌 Keeping global WebSocket alive for other hooks');
      }
      ws.current = null;
    };
  }, [user?.userId || user?.id]); // Only recreate when user ID changes, not the entire user object

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log(`📤 Sending WebSocket message:`, message);
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn(`❌ WebSocket not ready, message not sent:`, message);
    }
  };

  const joinRoom = (roomId: string) => {
    if (joinedRooms.current.has(roomId)) {
      console.log(`🏠 Already joined room ${roomId}, skipping duplicate join`);
      return;
    }
    console.log(`🏠 Joining room: ${roomId}`);
    joinedRooms.current.add(roomId);
    sendMessage({ type: 'join_room', roomId });
  };

  const leaveRoom = (roomId: string) => {
    console.log(`🏠 Leaving room: ${roomId}`);
    joinedRooms.current.delete(roomId);
    sendMessage({ type: 'leave_room', roomId });
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
    joinRoom,
    leaveRoom,
  };
}
