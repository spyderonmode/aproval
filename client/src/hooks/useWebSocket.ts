import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket() {
  const { user } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);
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
        setLastMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.current?.close();
    };
  }, [user]);

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log(`📤 Sending WebSocket message:`, message);
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn(`❌ WebSocket not ready, message not sent:`, message);
    }
  };

  const joinRoom = (roomId: string) => {
    console.log(`🏠 Joining room: ${roomId}`);
    sendMessage({ type: 'join_room', roomId });
  };

  const leaveRoom = (roomId: string) => {
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
