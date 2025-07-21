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
  const joinedRooms = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    
    // Prevent duplicate connections by checking if one already exists
    if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
      console.log('🔌 WebSocket already exists, skipping duplicate connection');
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('🔌 Creating WebSocket connection for user:', (user as any)?.userId || (user as any)?.id);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);
      // Clear joined rooms on reconnect to prevent duplicates
      joinedRooms.current.clear();
      // Authenticate with WebSocket
      const authMessage = {
        type: 'auth',
        userId: (user as any)?.userId || (user as any)?.id,
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
          console.log('📨 useWebSocket: CHAT MESSAGE RECEIVED! Data:', message);
          console.log('📨 useWebSocket: Message details - sender:', message.message?.senderName, 'content:', message.message?.message);
          const chatEvent = new CustomEvent('chat_message_received', {
            detail: message
          });
          window.dispatchEvent(chatEvent);
          console.log('📨 useWebSocket: Chat event dispatched successfully');
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
          console.log('🏠 WebSocket: Game abandoned message received:', message);
          
          // Show toast notification directly
          const toastMessage = message.message || "Game ended because a player left the room.";
          
          // Create and show a temporary toast-like notification
          const notificationDiv = document.createElement('div');
          notificationDiv.innerHTML = `
            <div style="
              position: fixed;
              top: 20px;
              right: 20px;
              background: #ef4444;
              color: white;
              padding: 16px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              z-index: 9999;
              max-width: 400px;
              font-family: system-ui, -apple-system, sans-serif;
            ">
              <div style="font-weight: 600; margin-bottom: 4px;">Game Ended</div>
              <div style="font-size: 14px; opacity: 0.9;">${toastMessage}</div>
            </div>
          `;
          document.body.appendChild(notificationDiv);
          
          // Force page reload after showing the notification
          console.log('🏠 WebSocket: Reloading page due to game abandonment');
          setTimeout(() => {
            window.location.reload();
          }, 2000); // Give user time to see the notification
          
          return; // Don't set lastMessage to prevent useEffect processing
        }
        
        // For critical reconnection messages, dispatch custom events immediately
        if (message.type === 'game_reconnection') {
          console.log('🔔 Dispatching immediate game_reconnection event');
          window.dispatchEvent(new CustomEvent('game_reconnection', {
            detail: message
          }));
        }

        // Handle online status updates for friends list
        if (message.type === 'online_users_update' || message.type === 'user_offline') {
          console.log('👥 Dispatching online status update:', message.type);
          window.dispatchEvent(new CustomEvent('online_status_update', {
            detail: message
          }));
        }
        
        console.log('🔔 Setting lastMessage in useWebSocket:', message.type);
        setLastMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.current.onclose = (event) => {
      console.log('🔌 WebSocket connection closed:', event.code, event.reason);
      console.log('🔌 Close event details:', event);
      setIsConnected(false);
      // Don't clear game state on connection close to prevent white screen
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      console.log('🔌 Cleaning up WebSocket connection');
      if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
        ws.current.close();
      }
      ws.current = null;
    };
  }, [(user as any)?.userId || (user as any)?.id]); // Only recreate when user ID changes, not the entire user object

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
