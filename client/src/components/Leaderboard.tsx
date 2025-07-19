import { useState, useEffect } from "react";
import { PlayerProfileModal } from "./PlayerProfileModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trophy, Medal, Award, Crown, TrendingUp, Users, Target, Loader2 } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface LeaderboardUser {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  winRate: number;
  selectedAchievementBorder: string;
}

interface LeaderboardProps {
  trigger?: React.ReactNode;
}

export function Leaderboard({ trigger }: LeaderboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();

  const { data: leaderboard, isLoading, error, refetch } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard', language], // Include language in key to prevent cache conflicts
    queryFn: async () => {
      const response = await fetch('/api/leaderboard', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    enabled: isOpen, // Only fetch when modal is open
    retry: 3,
    staleTime: language === 'ar' ? 0 : 30000, // No cache for Arabic to force fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error(`Leaderboard fetch error (${language}):`, error);
    },
    onSuccess: (data) => {
      console.log(`Leaderboard data loaded (${language}):`, data?.length, 'users', data?.slice(0, 2));
    }
  });

  // Force refresh when modal opens or language changes
  useEffect(() => {
    if (isOpen) {
      console.log(`Modal opened (${language}) - forcing leaderboard refresh`);
      // Clear all leaderboard cache when switching to Arabic
      if (language === 'ar') {
        queryClient.removeQueries({ queryKey: ['/api/leaderboard'] });
      }
      refetch();
    }
  }, [isOpen, language, refetch, queryClient]);

  // Listen for external trigger to open leaderboard
  useEffect(() => {
    const handleOpenLeaderboard = () => {
      setIsOpen(true);
    };

    window.addEventListener('openLeaderboard', handleOpenLeaderboard);
    return () => window.removeEventListener('openLeaderboard', handleOpenLeaderboard);
  }, []);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">#{position}</span>;
    }
  };

  const getRankColor = (position: number) => {
    switch (position) {
      case 1:
        return "from-yellow-400 to-yellow-600 text-white";
      case 2:
        return "from-gray-300 to-gray-500 text-white";
      case 3:
        return "from-amber-400 to-amber-600 text-white";
      default:
        if (position <= 10) return "from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900/50 dark:to-blue-800/50 dark:text-blue-200";
        return "from-gray-50 to-gray-100 text-gray-700 dark:from-gray-800/50 dark:to-gray-700/50 dark:text-gray-300";
    }
  };

  // Achievement border system - golden borders integrated into profile pictures  
  const getAchievementBorder = (achievementLevel?: string) => {
    const borders = {
      'ultimateVeteran': {
        className: 'ring-4 ring-gradient-to-r ring-from-red-500 ring-via-orange-500 ring-to-yellow-500 shadow-[0_0_20px_rgba(255,69,0,0.6)] animate-pulse',
        level: 'Ultimate Veteran'
      },
      'grandmaster': {
        className: 'ring-4 ring-gradient-to-r ring-from-purple-500 ring-via-blue-500 ring-to-indigo-500 shadow-[0_0_16px_rgba(147,51,234,0.5)]',
        level: 'Grandmaster'
      },
      'champion': {
        className: 'ring-4 ring-gradient-to-r ring-from-yellow-400 ring-via-orange-500 ring-to-red-500 shadow-[0_0_16px_rgba(251,191,36,0.6)]',
        level: 'Champion'
      },
      'legend': {
        className: 'ring-3 ring-gradient-to-r ring-from-orange-400 ring-to-red-500 shadow-[0_0_12px_rgba(251,146,60,0.5)]',
        level: 'Legend'
      },
      'default': {
        className: '',
        level: ''
      }
    };
    
    return borders[achievementLevel as keyof typeof borders] || borders.default;
  };

  // Get achievement border styling for profile pictures
  const getAchievementBorderStyle = (user: LeaderboardUser, position: number) => {
    // Always show golden border for top 3 positions
    if (position <= 3) {
      switch (position) {
        case 1:
          return {
            borderClass: "ring-2 ring-yellow-400",
            glowEffect: "shadow-[0_0_12px_rgba(234,179,8,0.4)]",
            animation: "animate-pulse"
          };
        case 2:
          return {
            borderClass: "ring-2 ring-gray-400",
            glowEffect: "shadow-[0_0_12px_rgba(156,163,175,0.4)]",
            animation: "animate-pulse"
          };
        case 3:
          return {
            borderClass: "ring-2 ring-amber-400",
            glowEffect: "shadow-[0_0_12px_rgba(245,158,11,0.4)]",
            animation: "animate-pulse"
          };
      }
    }

    // Apply achievement-specific styling for users with achievement borders
    if (!user.selectedAchievementBorder) {
      return {
        borderClass: "ring-1 ring-gray-200 dark:ring-gray-600",
        glowEffect: "",
        animation: ""
      };
    }

    switch (user.selectedAchievementBorder) {
      case 'ultimate_veteran':
        return {
          borderClass: "ring-2 ring-orange-500",
          glowEffect: "shadow-[0_0_15px_rgba(255,99,71,0.5)]",
          animation: "animate-pulse"
        };
      case 'grandmaster':
        return {
          borderClass: "ring-2 ring-indigo-400",
          glowEffect: "shadow-[0_0_15px_rgba(165,180,252,0.5)]",
          animation: "animate-pulse"
        };
      case 'champion':
        return {
          borderClass: "ring-2 ring-purple-400",
          glowEffect: "shadow-[0_0_15px_rgba(196,181,253,0.5)]",
          animation: "animate-pulse"
        };
      case 'legend':
        return {
          borderClass: "ring-2 ring-orange-400",
          glowEffect: "shadow-[0_0_15px_rgba(251,146,60,0.5)]",
          animation: "animate-pulse"
        };
      default:
        return {
          borderClass: "ring-1 ring-gray-200 dark:ring-gray-600",
          glowEffect: "",
          animation: ""
        };
    }
  };

  const renderAchievementBorder = (user: LeaderboardUser, position: number) => {
    if (!user.selectedAchievementBorder) {
      return (
        <span className="font-semibold text-sm truncate">
          {user.displayName}
        </span>
      );
    }

    switch (user.selectedAchievementBorder) {
      case 'ultimate_veteran':
        return (
          <motion.span
            animate={{
              textShadow: [
                "0 0 8px #ff6347, 0 0 12px #ff4500, 0 0 16px #ffd700",
                "0 0 10px #ff1493, 0 0 15px #dc143c, 0 0 20px #8b0000",
                "0 0 9px #ff6600, 0 0 13px #ff3300, 0 0 17px #cc0000",
              ]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="font-black text-sm sm:text-base truncate text-orange-500"
          >
            🔥 {user.displayName}
          </motion.span>
        );
      case 'grandmaster':
        return (
          <motion.span
            animate={{
              textShadow: [
                "0 0 8px #e0e7ff, 0 0 12px #c7d2fe, 0 0 16px #a5b4fc",
                "0 0 10px #f3f4f6, 0 0 15px #e5e7eb, 0 0 20px #d1d5db",
                "0 0 9px #ddd6fe, 0 0 13px #c4b5fd, 0 0 17px #a78bfa"
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="font-bold text-sm sm:text-base truncate text-indigo-400"
          >
            💎 {user.displayName}
          </motion.span>
        );
      case 'champion':
        return (
          <motion.span
            animate={{
              textShadow: [
                "0 0 8px #8a2be2, 0 0 12px #4b0082, 0 0 16px #9932cc",
                "0 0 10px #00bfff, 0 0 15px #1e90ff, 0 0 20px #4169e1",
                "0 0 9px #ffd700, 0 0 13px #ffff00, 0 0 17px #ffa500"
              ]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="font-bold text-sm sm:text-base truncate text-purple-400"
          >
            👑 {user.displayName}
          </motion.span>
        );
      case 'legend':
        return (
          <motion.span
            animate={{
              textShadow: [
                "0 0 6px #ff4500, 0 0 12px #ff6600, 0 0 18px #ff8800",
                "0 0 8px #ff0000, 0 0 16px #ff3300, 0 0 24px #ff6600",
                "0 0 7px #ff8800, 0 0 14px #ffaa00, 0 0 21px #ffcc00"
              ]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="font-bold text-sm sm:text-base truncate text-orange-400"
          >
            🌟 {user.displayName}
          </motion.span>
        );
      default:
        return (
          <span className="font-semibold text-sm sm:text-base truncate">
            {user.displayName}
          </span>
        );
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-2">
      <Trophy className="w-4 h-4" />
      {t('leaderboard') || 'Leaderboard'}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}>
          {trigger || defaultTrigger}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[95vh] w-[95vw] sm:w-full mx-auto flex flex-col overflow-hidden bg-gradient-to-br from-slate-50/95 via-white/98 to-blue-50/90 dark:from-slate-900/95 dark:via-slate-800/98 dark:to-slate-900/95 backdrop-blur-md border border-white/20 dark:border-gray-700/30 shadow-2xl">
        <DialogHeader className="flex-shrink-0 pb-6 border-b bg-gradient-to-r from-transparent via-gray-200/50 to-transparent dark:via-gray-600/30 relative overflow-hidden">
          {/* Enhanced Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/30 via-orange-50/20 to-red-50/30 dark:from-yellow-900/10 dark:via-orange-900/5 dark:to-red-900/10"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-32 bg-gradient-to-b from-yellow-100/20 to-transparent dark:from-yellow-800/10 blur-3xl"></div>
          
          <div className="text-center space-y-3 relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <DialogTitle className="flex items-center justify-center gap-4 text-3xl font-extrabold">
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Trophy className="w-10 h-10 text-yellow-500 drop-shadow-2xl filter brightness-110" />
                </motion.div>
                <span className="bg-gradient-to-r from-yellow-600 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-sm">
                  {t('leaderboard') || 'Leaderboard'}
                </span>
              </DialogTitle>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="space-y-2"
            >
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 px-4 py-2 rounded-full border border-yellow-200/50 dark:border-yellow-700/30 shadow-lg backdrop-blur-sm">
                <Crown className="w-4 h-4 text-yellow-600" />
                <p className="text-gray-700 dark:text-gray-200 text-sm font-semibold">
                  {t('top100Players') || 'Top 100 Players'}
                </p>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-xs max-w-md mx-auto leading-relaxed">
                {t('leaderboardDescription') || 'The best players ranked by total wins. Achievement borders show player status!'}
              </p>
            </motion.div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 flex-1">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">{t('loadingLeaderboard') || 'Loading leaderboard...'}</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 flex-1 text-red-500">
            <span>{t('errorLoadingLeaderboard') || 'Error loading leaderboard. Please try again.'}</span>
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm max-w-md">
              <p>Debug details:</p>
              <p>Error: {String(error)}</p>
              <p>Modal open: {isOpen.toString()}</p>
              <p>Data length: {leaderboard?.length || 'undefined'}</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="space-y-1.5 pb-3 pr-2 pt-2">
              {/* Debug info always visible when no data */}
              {!isLoading && !leaderboard && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-800 dark:text-yellow-200 text-sm">
                  <p>Debug: No data received</p>
                  <p>Language: {language}</p>
                  <p>Loading: {isLoading.toString()}</p>
                  <p>Error: {error ? String(error) : 'None'}</p>
                  <p>Modal open: {isOpen.toString()}</p>
                  <p>Data: {leaderboard ? `${leaderboard.length} users` : 'null/undefined'}</p>
                  <button 
                    onClick={() => {
                      console.log('Force refresh clicked');
                      refetch();
                    }} 
                    className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-xs"
                  >
                    Force Refresh ({language})
                  </button>
                </div>
              )}
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((user, index) => {
                  const position = index + 1;
                  const winRatePercentage = Math.round(user.winRate * 100);
                  const isTopThree = position <= 3;
                  const achievementBorder = getAchievementBorder(user.selectedAchievementBorder);
                  
                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="group hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-blue-50/30 dark:hover:from-gray-800/30 dark:hover:to-blue-900/20 rounded-xl p-1.5 sm:p-2 transition-all duration-300 hover:shadow-lg backdrop-blur-sm border border-transparent hover:border-blue-200/30 dark:hover:border-blue-700/30"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* Position Number with Enhanced Styling */}
                        <motion.div 
                          className={`
                            flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold
                            ${isTopThree 
                              ? 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 text-white shadow-lg' 
                              : 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 text-gray-700 dark:text-gray-300'
                            }
                          `}
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          {position}
                        </motion.div>

                        {/* Profile Picture with Achievement Border */}
                        <motion.div 
                          className={`relative flex-shrink-0 ${achievementBorder.className}`}
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <img
                            src={user.profileImageUrl || '/default-avatar.png'}
                            alt={user.displayName}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-md"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/default-avatar.png';
                            }}
                          />
                        </motion.div>

                        {/* User Info - Ultra Compact Mobile Layout */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
                                {user.displayName || user.username}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-tight hidden sm:block">
                                @{user.username}
                              </p>
                            </div>
                            
                            {/* Stats - Ultra Mobile Optimized */}
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                              <div className="text-center">
                                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
                                  {user.wins}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                                  {(t('wins') || 'Wins').substring(0, 3)}
                                </div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 leading-tight">
                                  {user.totalGames}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                                  {(t('games') || 'Games').substring(0, 3)}
                                </div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-xs font-bold text-purple-600 dark:text-purple-400 leading-tight">
                                  {winRatePercentage}%
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                                  {(t('winRate') || 'Rate').substring(0, 3)}
                                </div>
                              </div>

                              {/* View Profile Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 sm:h-6 sm:w-6 p-0 opacity-70 hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPlayerId(user.id);
                                  setShowPlayerProfile(true);
                                }}
                              >
                                <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>{t('noPlayersFound') || 'No players found. Start playing to appear on the leaderboard!'}</p>
                  {error && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm">
                      <p>Debug info: {JSON.stringify(error)}</p>
                      <p>Is loading: {isLoading.toString()}</p>
                      <p>Modal open: {isOpen.toString()}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-6 border-t border-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700 flex-shrink-0 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {leaderboard?.length ? 
                `${t('showing') || 'Showing'} ${leaderboard.length} ${t('players') || 'players'}` :
                ''
              }
            </span>
          </div>
          <Button onClick={() => setIsOpen(false)} variant="default" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg px-6">
            {t('close') || 'Close'}
          </Button>
        </div>
      </DialogContent>

      {/* Player Profile Modal */}
      <PlayerProfileModal
        playerId={selectedPlayerId}
        open={showPlayerProfile}
        onClose={() => {
          setShowPlayerProfile(false);
          setSelectedPlayerId(null);
        }}
        currentUserId={undefined} // TODO: Get current user ID from context
      />
    </Dialog>
  );
}