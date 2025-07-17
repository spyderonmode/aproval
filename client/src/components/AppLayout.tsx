import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GamepadIcon, MessageCircle, Users, Trophy, Settings, User, Home, ChevronLeft, X } from "lucide-react";
import { ChatNotificationModal } from "@/components/ChatNotificationModal";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onlineUserCount?: number;
}

interface ChatMessage {
  id: string;
  fromUserId: string;
  fromUser: string;
  message: string;
  timestamp: string;
}

interface ChatNotification {
  message: ChatMessage;
  fromUser: string;
}

export function AppLayout({ children, currentPage, onPageChange, onlineUserCount = 0 }: AppLayoutProps) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [chatNotification, setChatNotification] = useState<ChatNotification | null>(null);
  const { user } = useAuth();
  const { lastMessage } = useWebSocket();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'game', label: 'Play Game', icon: GamepadIcon },
    { id: 'chat', label: 'Chat', icon: MessageCircle, badge: onlineUserCount > 0 ? onlineUserCount.toString() : undefined },
    { id: 'players', label: 'Players', icon: Users },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Handle chat message notifications
  useEffect(() => {
    if (lastMessage?.type === 'chat_message_received') {
      const messageData = lastMessage;
      
      // Only show notification if not currently on chat page and message is not from current user
      if (currentPage !== 'chat' && messageData.fromUserId !== (user?.userId || user?.id)) {
        setChatNotification({
          message: {
            id: Date.now().toString(),
            fromUserId: messageData.fromUserId,
            fromUser: messageData.fromUser,
            message: messageData.message,
            timestamp: new Date().toLocaleTimeString()
          },
          fromUser: messageData.fromUser
        });
      }
    }
  }, [lastMessage, currentPage, user]);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setShowSidebar(false);
      }
    };

    if (showSidebar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSidebar]);

  const handlePageSelect = (pageId: string) => {
    onPageChange(pageId);
    setShowSidebar(false);
  };

  const handleChatNotificationReply = (reply: string) => {
    // Handle reply logic here
    console.log('Reply to chat:', reply);
    setChatNotification(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* App Header */}
      <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3 relative z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(true)}
              className="p-2 hover:bg-slate-700"
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                <div className="w-4 h-0.5 bg-white rounded"></div>
                <div className="w-4 h-0.5 bg-white rounded"></div>
                <div className="w-4 h-0.5 bg-white rounded"></div>
              </div>
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GamepadIcon className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg">TicTac Game</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onlineUserCount > 0 && (
              <Badge variant="secondary" className="bg-green-600/20 text-green-400">
                <Users className="w-3 h-3 mr-1" />
                {onlineUserCount} online
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Sliding Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full w-72 bg-slate-800 border-r border-slate-700 transform transition-transform duration-300 ease-in-out z-30 ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GamepadIcon className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg">TicTac Game</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(false)}
              className="p-1"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start h-12 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-slate-700 text-slate-300'
                  }`}
                  onClick={() => handlePageSelect(item.id)}
                >
                  <IconComponent className="w-5 h-5 mr-3" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2 bg-primary/20">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </nav>

          {/* User Info at Bottom */}
          <div className="absolute bottom-4 left-4 right-4">
            <Card className="bg-slate-700 border-slate-600">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user?.displayName || user?.firstName || user?.username || 'Player'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {user?.email || 'Guest'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-20"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Page Content with Slide Animation */}
      <main className="relative z-10">
        <div className="transform transition-transform duration-300 ease-in-out">
          {children}
        </div>
      </main>

      {/* Chat Notification Modal */}
      {chatNotification && (
        <ChatNotificationModal
          message={chatNotification.message}
          fromUser={chatNotification.fromUser}
          onReply={handleChatNotificationReply}
          onClose={() => setChatNotification(null)}
        />
      )}
    </div>
  );
}