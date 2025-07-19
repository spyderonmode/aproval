import { useState, useEffect } from "react";
import { PlayerProfileModal } from "./PlayerProfileModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
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
  const { t } = useTranslation();

  const { data: leaderboard, isLoading, error } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/leaderboard'],
    enabled: isOpen, // Only fetch when modal is open
  });

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
            borderClass: "ring-4 ring-yellow-400",
            glowEffect: "shadow-[0_0_20px_rgba(234,179,8,0.6)] shadow-yellow-400/60",
            animation: "animate-pulse"
          };
        case 2:
          return {
            borderClass: "ring-4 ring-gray-400",
            glowEffect: "shadow-[0_0_20px_rgba(156,163,175,0.6)] shadow-gray-400/60",
            animation: "animate-pulse"
          };
        case 3:
          return {
            borderClass: "ring-4 ring-amber-400",
            glowEffect: "shadow-[0_0_20px_rgba(245,158,11,0.6)] shadow-amber-400/60",
            animation: "animate-pulse"
          };
      }
    }

    // Apply achievement-specific styling for users with achievement borders
    if (!user.selectedAchievementBorder) {
      return {
        borderClass: "ring-2 ring-gray-200 dark:ring-gray-600",
        glowEffect: "",
        animation: ""
      };
    }

    switch (user.selectedAchievementBorder) {
      case 'ultimate_veteran':
        return {
          borderClass: "ring-4 ring-orange-500",
          glowEffect: "shadow-[0_0_25px_rgba(255,99,71,0.8)] shadow-orange-500/80",
          animation: "animate-pulse"
        };
      case 'grandmaster':
        return {
          borderClass: "ring-4 ring-indigo-400",
          glowEffect: "shadow-[0_0_25px_rgba(165,180,252,0.8)] shadow-indigo-400/80",
          animation: "animate-pulse"
        };
      case 'champion':
        return {
          borderClass: "ring-4 ring-purple-400",
          glowEffect: "shadow-[0_0_25px_rgba(196,181,253,0.8)] shadow-purple-400/80",
          animation: "animate-pulse"
        };
      case 'legend':
        return {
          borderClass: "ring-4 ring-orange-400",
          glowEffect: "shadow-[0_0_25px_rgba(251,146,60,0.8)] shadow-orange-400/80",
          animation: "animate-pulse"
        };
      default:
        return {
          borderClass: "ring-2 ring-gray-200 dark:ring-gray-600",
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
      <DialogContent className="max-w-5xl max-h-[95vh] w-[95vw] sm:w-full mx-auto flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <DialogHeader className="flex-shrink-0 pb-6 border-b border-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700">
          <div className="text-center space-y-2">
            <DialogTitle className="flex items-center justify-center gap-3 text-2xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
              <Trophy className="w-8 h-8 text-yellow-500 drop-shadow-lg" />
              {t('leaderboard') || 'Leaderboard'}
            </DialogTitle>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              {t('top100Players') || 'Top 100 Players'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {t('leaderboardDescription') || 'The best players ranked by total wins. Achievement borders show player status!'}
            </p>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 flex-1">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">{t('loadingLeaderboard') || 'Loading leaderboard...'}</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 flex-1 text-red-500">
            <span>{t('errorLoadingLeaderboard') || 'Error loading leaderboard. Please try again.'}</span>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="space-y-3 pb-6 pr-4 pt-4">
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
                      <Card 
                        className={`relative cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 ${
                        position <= 3 ? 'border-2 shadow-xl' : 'border shadow-lg'} ${
                        position === 1 ? 'border-yellow-400 shadow-yellow-200/30 bg-gradient-to-r from-yellow-50 via-white to-yellow-50 dark:from-yellow-900/20 dark:via-slate-800 dark:to-yellow-900/20' :
                        position === 2 ? 'border-gray-400 shadow-gray-200/30 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-700/20 dark:via-slate-800 dark:to-gray-700/20' :
                        position === 3 ? 'border-amber-400 shadow-amber-200/30 bg-gradient-to-r from-amber-50 via-white to-amber-50 dark:from-amber-900/20 dark:via-slate-800 dark:to-amber-900/20' : 
                        'bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-750 dark:to-slate-800 border-gray-200 dark:border-gray-700'
                      } ${position <= 3 ? 'ring-2 ring-opacity-20 ' + (position === 1 ? 'ring-yellow-400' : position === 2 ? 'ring-gray-400' : 'ring-amber-400') : ''}`}
                        onClick={() => {
                          setSelectedPlayerId(user.id);
                          setShowPlayerProfile(true);
                        }}>
                        <CardContent className="p-4 sm:p-6 relative">
                          {/* Top 3 Background Decoration */}
                          {position <= 3 && (
                            <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 ${
                              position === 1 ? 'text-yellow-400' : position === 2 ? 'text-gray-400' : 'text-amber-400'
                            }`}>
                              {position === 1 ? (
                                <Crown className="w-full h-full" />
                              ) : position === 2 ? (
                                <Medal className="w-full h-full" />
                              ) : (
                                <Award className="w-full h-full" />
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-3 sm:gap-5 relative z-10">
                            {/* Profile Picture with Achievement Border */}
                            <div className="flex-shrink-0 relative">
                              {(() => {
                                const borderStyle = getAchievementBorderStyle(user, position);
                                return (
                                  <motion.div
                                    className="relative"
                                    animate={borderStyle.animation ? { scale: [1, 1.02, 1] } : {}}
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                      ease: "easeInOut"
                                    }}
                                  >
                                    {user.profileImageUrl ? (
                                      <img
                                        src={user.profileImageUrl}
                                        alt={`${user.displayName}'s profile`}
                                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-3 border-white dark:border-slate-700 shadow-lg ${borderStyle.borderClass} ${borderStyle.glowEffect} transition-all duration-300`}
                                      />
                                    ) : (
                                      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg ${borderStyle.borderClass} ${borderStyle.glowEffect} transition-all duration-300`}>
                                        {user.displayName.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    {/* Position Badge - small overlay on profile */}
                                    {position <= 3 && (
                                      <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br ${getRankColor(position)} flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800`}>
                                        <span className="text-xs font-bold">#{position}</span>
                                      </div>
                                    )}
                                    {/* Online Status Indicator */}
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white dark:border-slate-800 rounded-full shadow-sm z-10"></div>
                                  </motion.div>
                                );
                              })()}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 mb-3">
                                <div className="min-w-0 flex-1">
                                  <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1">
                                    {renderAchievementBorder(user, position)}
                                  </div>
                                  <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium">
                                    @{user.username}
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Stats Grid */}
                              <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 border border-green-200 dark:border-green-800">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <Trophy className="w-3 h-3 text-green-600" />
                                    <span className="text-xs font-medium text-green-600 dark:text-green-400">{t('wins') || 'Wins'}</span>
                                  </div>
                                  <div className="text-lg font-bold text-green-700 dark:text-green-300">{user.wins}</div>
                                </div>
                                
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <Target className="w-3 h-3 text-blue-600" />
                                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{t('winRate') || 'Win Rate'}</span>
                                  </div>
                                  <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{winRatePercentage}%</div>
                                </div>
                                
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 border border-purple-200 dark:border-purple-800">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <Users className="w-3 h-3 text-purple-600" />
                                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">{t('games') || 'Games'}</span>
                                  </div>
                                  <div className="text-lg font-bold text-purple-700 dark:text-purple-300">{user.totalGames}</div>
                                </div>
                              </div>
                            </div>

                            {/* Performance Badge */}
                            <div className="hidden lg:flex flex-col items-center text-center flex-shrink-0 min-w-[100px]">
                              <div className="mb-2">
                                <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  winRatePercentage >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                  winRatePercentage >= 60 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                  winRatePercentage >= 40 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                }`}>
                                  {winRatePercentage >= 80 ? 'Elite' :
                                   winRatePercentage >= 60 ? 'Expert' :
                                   winRatePercentage >= 40 ? 'Good' : 'Improving'}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                {t('wld') || 'W-L-D'}
                              </div>
                              <div className="text-xs font-mono whitespace-nowrap bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                <span className="text-green-600 dark:text-green-400 font-bold">{user.wins}</span>
                                <span className="text-gray-400 mx-1">-</span>
                                <span className="text-red-600 dark:text-red-400 font-bold">{user.losses}</span>
                                <span className="text-gray-400 mx-1">-</span>
                                <span className="text-yellow-600 dark:text-yellow-400 font-bold">{user.draws}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>{t('noPlayersFound') || 'No players found. Start playing to appear on the leaderboard!'}</p>
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