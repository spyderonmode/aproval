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

      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {

      setIsConnected(true);
      // Clear joined rooms on reconnect to prevent duplicates
      joinedRooms.current.clear();
      // Authenticate with WebSocket
      const authMessage = {
        type: 'auth',
        userId: (user as any)?.userId || (user as any)?.id,
      };

      ws.current?.send(JSON.stringify(authMessage));
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        // Remove verbose logging for game messages
        
        // Dispatch custom events for different message types
        if (message.type === 'chat_message_received') {
          const chatEvent = new CustomEvent('chat_message_received', {
            detail: message
          });
          window.dispatchEvent(chatEvent);
        }

        // Handle room invitation messages
        if (message.type === 'room_invitation') {
          const invitationEvent = new CustomEvent('room_invitation_received', {
            detail: message.invitation
          });
          window.dispatchEvent(invitationEvent);
        }

        // Handle game abandonment due to player leaving
        if (message.type === 'game_abandoned') {
          
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
          
          // Clear any stored game state to prevent reconnection
          localStorage.removeItem('currentGameState');
          sessionStorage.removeItem('currentGameState');
          
          // Force page reload after showing the notification
          setTimeout(() => {
            window.location.href = '/'; // Redirect to root instead of reload to prevent reconnection
          }, 2000); // Give user time to see the notification
          
          return; // Don't set lastMessage to prevent useEffect processing
        }
        
        // Handle spectator leaving and needing to redirect to home
        if (message.type === 'spectator_left') {
          console.log('👀 WebSocket: Spectator left message received:', message);
          
          // Clear any stored game state to prevent reconnection
          localStorage.removeItem('currentGameState');
          sessionStorage.removeItem('currentGameState');
          
          // Force page reload to go back to home
          console.log('👀 WebSocket: Reloading page for spectator leave');
          window.location.href = '/';
          
          return; // Don't set lastMessage to prevent useEffect processing
        }
        
        // For critical reconnection messages, dispatch custom events immediately
        if (message.type === 'game_reconnection') {
          // Dispatching immediate game_reconnection event
          window.dispatchEvent(new CustomEvent('game_reconnection', {
            detail: message
          }));
        }

        // Handle online status updates for friends list
        if (message.type === 'online_users_update' || message.type === 'user_offline') {
          // Dispatching online status update
          window.dispatchEvent(new CustomEvent('online_status_update', {
            detail: message
          }));
        }
        
        // Setting lastMessage in useWebSocket
        setLastMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.current.onclose = (event) => {

      setIsConnected(false);
      // Don't clear game state on connection close to prevent white screen
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {

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
