import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { HomePage } from "@/components/HomePage";
import { GamePage } from "@/components/GamePage";
import { ChatPage } from "@/components/ChatPage";
import { PlayersPage } from "@/components/PlayersPage";
import { AchievementsPage } from "@/components/AchievementsPage";
import { ProfilePage } from "@/components/ProfilePage";
import { SettingsPage } from "@/components/SettingsPage";
import { EmailVerificationModal } from "@/components/EmailVerificationModal";

export default function Home() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [onlineUserCount, setOnlineUserCount] = useState(0);
  const { lastMessage } = useWebSocket();

  const { data: userStats } = useQuery({
    queryKey: ["/api/users/online-stats"],
    enabled: !!user,
  });

  // Check if email verification is required
  useEffect(() => {
    if (user && user.email && !user.isEmailVerified) {
      setShowEmailVerification(true);
    }
  }, [user]);

  // Handle WebSocket messages for online user count
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'online_users_update':
          setOnlineUserCount(lastMessage.count);
          break;
      }
    }
  }, [lastMessage]);

  // Render the appropriate page component
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onPageChange={setCurrentPage} onlineUserCount={onlineUserCount} />;
      case 'game':
        return <GamePage onPageChange={setCurrentPage} />;
      case 'chat':
        return <ChatPage />;
      case 'players':
        return <PlayersPage onPageChange={setCurrentPage} />;
      case 'achievements':
        return <AchievementsPage />;
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage onPageChange={setCurrentPage} onlineUserCount={onlineUserCount} />;
    }
  };

  return (
    <AppLayout
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      onlineUserCount={onlineUserCount}
    >
      {renderCurrentPage()}
      
      {/* Email Verification Modal */}
      {showEmailVerification && (
        <EmailVerificationModal
          onClose={() => setShowEmailVerification(false)}
          userEmail={user?.email || ''}
        />
      )}
    </AppLayout>
  );
}