import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AchievementBadge } from "./AchievementBadge";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Trophy, Target, Star, Crown, Zap, Medal } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";

interface AchievementModalProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
}

export function AchievementModal({ open, onClose, userId }: AchievementModalProps) {
  const { t } = useTranslation();
  
  // Helper function to get translated achievement description
  const getTranslatedDescription = (achievementType: string, originalDescription: string): string => {
    switch (achievementType) {
      case 'speed_demon':
        return t('speedDemonDesc');
      case 'legend':
        return t('legendDesc');
      case 'champion':
        return t('championDesc');
      default:
        return originalDescription;
    }
  };
  const { data: achievements, isLoading } = useQuery({
    queryKey: userId ? ['/api/users', userId, 'achievements'] : ['/api/achievements'],
    enabled: open,
  });

  const achievementCategories = [
    {
      title: t('victoryAchievements'),
      icon: <Trophy className="w-5 h-5" />,
      types: ['first_win', 'win_streak_5', 'win_streak_10', 'speed_demon', 'legend', 'champion']
    },
    {
      title: t('skillAchievements'), 
      icon: <Target className="w-5 h-5" />,
      types: ['master_of_diagonals', 'comeback_king']
    },
    {
      title: t('experienceAchievements'),
      icon: <Star className="w-5 h-5" />,
      types: ['veteran_player']
    }
  ];

  const getAchievementsByCategory = (types: string[]) => {
    if (!achievements) return [];
    return achievements.filter((achievement: any) => types.includes(achievement.achievementType));
  };

  const allPossibleAchievements = [
    { type: 'first_win', name: t('firstVictoryTitle'), description: t('winYourVeryFirstGame'), icon: '🏆' },
    { type: 'win_streak_5', name: t('winStreakMaster'), description: t('winFiveConsecutiveGames'), icon: '🔥' },
    { type: 'win_streak_10', name: t('unstoppable'), description: t('winTenConsecutiveGames'), icon: '⚡' },
    { type: 'master_of_diagonals', name: t('masterOfDiagonals'), description: t('winThreeGamesDiagonally'), icon: '🎯' },
    { type: 'speed_demon', name: t('speedDemon'), description: t('winTwentyTotalGames'), icon: '⚡' },
    { type: 'veteran_player', name: t('veteranPlayer'), description: t('playOneHundredTotalGames'), icon: '🎖️' },
    { type: 'comeback_king', name: t('comebackKing'), description: t('winAfterLosingFive'), icon: '👑' },
    { type: 'legend', name: t('legend'), description: t('achieveFiftyTotalWins'), icon: '🌟' },
    { type: 'champion', name: t('champion'), description: t('achieveOneHundredTotalWins'), icon: '👑' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full mx-auto flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            {userId ? t('playerAchievements') : t('yourAchievements')}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 flex-1">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="space-y-6 pb-6 pr-4">
              {achievementCategories.map((category) => {
                const categoryAchievements = getAchievementsByCategory(category.types);
                const possibleAchievements = allPossibleAchievements.filter(a => category.types.includes(a.type));
                
                return (
                  <div key={category.title} className="space-y-3">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      {category.icon}
                      {category.title}
                      <span className="text-sm text-gray-500">
                        ({categoryAchievements.length}/{possibleAchievements.length})
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {possibleAchievements.map((possible) => {
                        const earned = categoryAchievements.find((a: any) => a.achievementType === possible.type);
                        
                        if (earned) {
                          return (
                            <div
                              key={earned.id}
                              className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700/50"
                            >
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                  {earned.icon}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
                                  {earned.achievementName}
                                </div>
                                <div className="text-xs text-amber-700 dark:text-amber-300 mt-1 leading-tight">
                                  {getTranslatedDescription(earned.achievementType, earned.description)}
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          // Show locked achievement
                          return (
                            <div
                              key={possible.type}
                              className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-600 opacity-60"
                            >
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-xl grayscale">
                                  {possible.icon}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-600 dark:text-gray-400 text-sm flex items-center gap-2">
                                  <span>🔒</span>
                                  {possible.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 leading-tight">
                                  {getTranslatedDescription(possible.type, possible.description)}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      })}
                    </div>
                  </div>
                );
              })}
              
              {achievements && achievements.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No achievements yet. Start playing to earn your first badge!</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <Button onClick={onClose} variant="default">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}