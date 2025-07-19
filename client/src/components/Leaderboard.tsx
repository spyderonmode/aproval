import { useState, useEffect } from "react";
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
            className="font-black text-sm truncate text-orange-500"
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
            className="font-bold text-sm truncate text-indigo-400"
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
            className="font-bold text-sm truncate text-purple-400"
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
            className="font-bold text-sm truncate text-orange-400"
          >
            🌟 {user.displayName}
          </motion.span>
        );
      default:
        return (
          <span className="font-semibold text-sm truncate">
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
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full mx-auto flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="w-6 h-6 text-yellow-500" />
            {t('leaderboard') || 'Leaderboard'} - {t('top100Players') || 'Top 100 Players'}
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('leaderboardDescription') || 'The best players ranked by total wins. Achievement borders show player status!'}
          </p>
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
            <div className="space-y-2 pb-6 pr-4">
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
                      <Card className={`transition-all hover:shadow-lg ${position <= 3 ? 'border-2' : ''} ${
                        position === 1 ? 'border-yellow-400 shadow-yellow-200/50' :
                        position === 2 ? 'border-gray-400 shadow-gray-200/50' :
                        position === 3 ? 'border-amber-400 shadow-amber-200/50' : ''
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Rank */}
                            <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br ${getRankColor(position)} flex-shrink-0`}>
                              {getRankIcon(position)}
                            </div>

                            {/* Profile Picture */}
                            <div className="flex-shrink-0">
                              {user.profileImageUrl ? (
                                <img
                                  src={user.profileImageUrl}
                                  alt={`${user.displayName}'s profile`}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                  {user.displayName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {renderAchievementBorder(user, position)}
                                <Badge variant="secondary" className="text-xs">
                                  @{user.username}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Trophy className="w-4 h-4 text-yellow-500" />
                                  <span className="font-semibold text-green-600 dark:text-green-400">{user.wins}</span>
                                  <span>{t('winsCount') || 'wins'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Target className="w-4 h-4 text-blue-500" />
                                  <span>{winRatePercentage}%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4 text-gray-500" />
                                  <span>{user.totalGames}</span>
                                  <span>{t('games') || 'games'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Stats Summary */}
                            <div className="hidden sm:flex flex-col items-end text-right">
                              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                {t('wld') || 'W-L-D'}
                              </div>
                              <div className="text-sm font-mono">
                                <span className="text-green-600 dark:text-green-400">{user.wins}</span>
                                <span className="text-gray-400 mx-1">-</span>
                                <span className="text-red-600 dark:text-red-400">{user.losses}</span>
                                <span className="text-gray-400 mx-1">-</span>
                                <span className="text-yellow-600 dark:text-yellow-400">{user.draws}</span>
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

        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {leaderboard?.length ? 
              `${t('showing') || 'Showing'} ${leaderboard.length} ${t('players') || 'players'}` :
              ''
            }
          </div>
          <Button onClick={() => setIsOpen(false)} variant="default">
            {t('close') || 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}