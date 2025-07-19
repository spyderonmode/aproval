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
  open?: boolean;
  onClose?: () => void;
}

export function Leaderboard({ trigger, open, onClose }: LeaderboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Use external open state if provided, otherwise use internal state
  const modalOpen = open !== undefined ? open : isOpen;
  const handleClose = onClose || (() => setIsOpen(false));
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const isArabic = language === 'ar';

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
    enabled: modalOpen, // Only fetch when modal is open
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
    if (modalOpen) {
      console.log(`Modal opened (${language}) - forcing leaderboard refresh`);
      // Clear all leaderboard cache when switching to Arabic
      if (language === 'ar') {
        queryClient.removeQueries({ queryKey: ['/api/leaderboard'] });
      }
      refetch();
    }
  }, [modalOpen, language, refetch, queryClient]);

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
    <Dialog open={modalOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <div onClick={(e) => {
          e.stopPropagation();
          if (open !== undefined) {
            // External control - don't use internal state
            onClose?.();
          } else {
            setIsOpen(true);
          }
        }}>
          {trigger || defaultTrigger}
        </div>
      </DialogTrigger>
      <DialogContent 
        className={`max-w-[96vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl max-h-[94vh] sm:max-h-[90vh] w-full mx-auto flex flex-col overflow-hidden bg-gradient-to-br from-slate-50/95 via-white/98 to-blue-50/90 dark:from-slate-900/95 dark:via-slate-800/98 dark:to-slate-900/95 backdrop-blur-md border border-white/20 dark:border-gray-700/30 shadow-2xl ${isArabic ? 'font-arabic' : ''}`}
        style={isArabic ? { 
          fontFamily: "'Noto Sans Arabic', 'Cairo', 'Tajawal', system-ui, sans-serif",
          direction: 'rtl'
        } : {}}
      >
        <DialogHeader className="flex-shrink-0 pb-3 sm:pb-6 border-b bg-gradient-to-r from-transparent via-gray-200/50 to-transparent dark:via-gray-600/30 relative overflow-hidden">
          {/* Enhanced Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/30 via-orange-50/20 to-red-50/30 dark:from-yellow-900/10 dark:via-orange-900/5 dark:to-red-900/10"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-32 bg-gradient-to-b from-yellow-100/20 to-transparent dark:from-yellow-800/10 blur-3xl"></div>
          
          <div className="text-center space-y-2 sm:space-y-3 relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <DialogTitle className={`flex items-center justify-center gap-2 sm:gap-4 text-xl sm:text-2xl md:text-3xl font-extrabold ${isArabic ? 'font-arabic' : ''}`}>
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
                  <Trophy className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-yellow-500 drop-shadow-2xl filter brightness-110" />
                </motion.div>
                <span className={`bg-gradient-to-r from-yellow-600 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-sm ${isArabic ? 'font-arabic' : ''}`}>
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
              <div className="inline-flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 px-2 sm:px-4 py-1 sm:py-2 rounded-full border border-yellow-200/50 dark:border-yellow-700/30 shadow-lg backdrop-blur-sm">
                <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                <p className="text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-semibold">
                  {t('top100Players') || 'Top 100 Players'}
                </p>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm max-w-xs sm:max-w-md mx-auto leading-relaxed px-2 hidden sm:block">
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
          <div className="flex-1 min-h-0 overflow-y-auto px-1 sm:px-2" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="space-y-1 sm:space-y-1.5 py-2 sm:py-3">
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
                  
                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Card 
                          className={`relative cursor-pointer overflow-hidden ${
                          position <= 3 ? 'border-2 shadow-xl' : 'border shadow-lg'} ${
                          position === 1 ? 'border-yellow-400/50 bg-gradient-to-br from-yellow-50/80 via-white to-yellow-100/60 dark:from-yellow-900/20 dark:via-slate-800 dark:to-yellow-800/20 shadow-yellow-200/40' :
                          position === 2 ? 'border-gray-400/50 bg-gradient-to-br from-gray-50/80 via-white to-gray-100/60 dark:from-gray-700/20 dark:via-slate-800 dark:to-gray-600/20 shadow-gray-200/40' :
                          position === 3 ? 'border-amber-400/50 bg-gradient-to-br from-amber-50/80 via-white to-amber-100/60 dark:from-amber-900/20 dark:via-slate-800 dark:to-amber-800/20 shadow-amber-200/40' : 
                          'bg-gradient-to-br from-slate-50/90 via-white to-blue-50/40 dark:from-slate-800/90 dark:via-slate-750 dark:to-slate-700/90 border-gray-200/60 dark:border-gray-600/40 shadow-gray-100/60'
                        } ${position <= 3 ? 'ring-2 ring-opacity-30 shadow-2xl ' + (position === 1 ? 'ring-yellow-300/40' : position === 2 ? 'ring-gray-300/40' : 'ring-amber-300/40') : 'ring-1 ring-gray-200/30 dark:ring-gray-600/30'} backdrop-blur-sm`}
                        onClick={() => {
                          setSelectedPlayerId(user.id);
                          setShowPlayerProfile(true);
                        }}>
                          <CardContent className={`${isArabic ? 'p-1.5 sm:p-2' : 'p-1 sm:p-2.5'} relative`}>
                            {/* Animated Background Gradient */}
                            <div className={`absolute inset-0 opacity-5 ${
                              position === 1 ? 'bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-400' :
                              position === 2 ? 'bg-gradient-to-r from-gray-300 via-gray-200 to-gray-400' :
                              position === 3 ? 'bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400' :
                              'bg-gradient-to-r from-blue-200 via-slate-100 to-indigo-200'
                            }`}></div>
                            {/* Enhanced Top 3 Background Decoration */}
                            {position <= 3 && (
                              <motion.div 
                                className={`absolute top-0 right-0 w-16 h-16 opacity-15 ${
                                  position === 1 ? 'text-yellow-400' : position === 2 ? 'text-gray-400' : 'text-amber-400'
                                }`}
                                animate={{ 
                                  rotate: [0, 5, -5, 0],
                                  scale: [1, 1.05, 1]
                                }}
                                transition={{ 
                                  duration: 4,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              >
                                {position === 1 ? (
                                  <Crown className="w-full h-full drop-shadow-lg" />
                                ) : position === 2 ? (
                                  <Medal className="w-full h-full drop-shadow-lg" />
                                ) : (
                                  <Award className="w-full h-full drop-shadow-lg" />
                                )}
                              </motion.div>
                            )}
                          
                          <div className="flex items-center gap-1 sm:gap-2 relative z-10">
                            {/* Rank Icon/Number */}
                            <div className="flex-shrink-0 flex items-center justify-center">
                              {getRankIcon(position)}
                            </div>

                            {/* Profile Picture with Achievement Border */}
                            <div className="flex-shrink-0 relative">
                              {(() => {
                                const borderStyle = getAchievementBorderStyle(user, position);
                                return (
                                  <motion.div
                                    className="relative"
                                    animate={borderStyle.animation ? { scale: [1, 1.01, 1] } : {}}
                                    transition={{
                                      duration: 3,
                                      repeat: Infinity,
                                      ease: "easeInOut"
                                    }}
                                  >
                                    {user.profileImageUrl ? (
                                      <img
                                        src={user.profileImageUrl}
                                        alt={`${user.displayName}'s profile`}
                                        className={`w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg object-cover border-2 border-white dark:border-slate-700 shadow-sm ${borderStyle.borderClass} ${borderStyle.glowEffect} transition-all duration-300`}
                                      />
                                    ) : (
                                      <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm ${borderStyle.borderClass} ${borderStyle.glowEffect} transition-all duration-300`}>
                                        {user.displayName.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    {/* Online Status Indicator */}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-slate-800 rounded-full shadow-sm z-10"></div>
                                  </motion.div>
                                );
                              })()}
                            </div>

                            {/* Simplified Arabic-friendly layout */}
                            <div className="flex-1 min-w-0 space-y-2">
                              {/* Name and Performance Badge Row */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <h3 className={`font-bold text-sm text-gray-900 dark:text-white truncate ${isArabic ? 'font-arabic' : ''}`}>
                                    {renderAchievementBorder(user, position)}
                                  </h3>
                                </div>
                                
                                <div className="flex-shrink-0">
                                  <span className={`text-xs px-2 py-1 rounded-full text-white font-medium ${
                                    winRatePercentage >= 70 ? 'bg-green-500' :
                                    winRatePercentage >= 55 ? 'bg-blue-500' :
                                    winRatePercentage >= 40 ? 'bg-yellow-500' : 'bg-gray-500'
                                  }`}>
                                    {isArabic ? (
                                      winRatePercentage >= 70 ? 'نخبة' :
                                      winRatePercentage >= 55 ? 'خبير' :
                                      winRatePercentage >= 40 ? 'جيد' : 'محسن'
                                    ) : (
                                      winRatePercentage >= 70 ? 'Elite' :
                                      winRatePercentage >= 55 ? 'Expert' :
                                      winRatePercentage >= 40 ? 'Good' : 'Improving'
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Stats Row */}
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-1.5">
                                  <div className="text-xs text-green-600 dark:text-green-400 font-medium">{t('wins') || 'Wins'}</div>
                                  <div className="text-sm font-bold text-green-700 dark:text-green-300" dir="ltr">{user.wins}</div>
                                </div>
                                
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-1.5">
                                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">{t('winRate') || 'Rate'}</div>
                                  <div className="text-sm font-bold text-blue-700 dark:text-blue-300" dir="ltr">{winRatePercentage}%</div>
                                </div>
                                
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-1.5">
                                  <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">{t('games') || 'Games'}</div>
                                  <div className="text-sm font-bold text-purple-700 dark:text-purple-300" dir="ltr">{user.totalGames}</div>
                                </div>
                              </div>

                              {/* W-L-D Badge */}
                              <div className="flex justify-center">
                                <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">{t('wld') || 'W-L-D'}:</span>
                                  <span className="text-xs font-mono" dir="ltr">
                                    <span className="text-green-600 dark:text-green-400 font-bold">{user.wins}</span>
                                    <span className="text-gray-400 mx-1">-</span>
                                    <span className="text-red-600 dark:text-red-400 font-bold">{user.losses}</span>
                                    <span className="text-gray-400 mx-1">-</span>
                                    <span className="text-yellow-600 dark:text-yellow-400 font-bold">{user.draws}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          </CardContent>
                        </Card>
                      </motion.div>
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

        <div className="flex justify-between items-center pt-3 sm:pt-6 border-t border-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700 flex-shrink-0 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className={`flex items-center gap-2 ${isArabic ? 'font-arabic' : ''}`}>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
              {leaderboard?.length ? 
                `${t('showing') || 'Showing'} ${leaderboard.length} ${t('players') || 'players'}` :
                ''
              }
            </span>
          </div>
          <Button onClick={() => setIsOpen(false)} variant="default" className={`bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg px-3 sm:px-6 text-xs sm:text-sm ${isArabic ? 'font-arabic' : ''}`}>
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