import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AchievementBadge } from "./AchievementBadge";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Trophy, Target, Star, Crown, Zap, Medal } from "lucide-react";

interface AchievementModalProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
}

export function AchievementModal({ open, onClose, userId }: AchievementModalProps) {
  const { data: achievements, isLoading } = useQuery({
    queryKey: userId ? ['/api/users', userId, 'achievements'] : ['/api/achievements'],
    enabled: open,
  });

  const achievementCategories = [
    {
      title: "Victory Achievements",
      icon: <Trophy className="w-5 h-5" />,
      types: ['first_win', 'win_streak_5', 'win_streak_10', 'speed_demon']
    },
    {
      title: "Skill Achievements", 
      icon: <Target className="w-5 h-5" />,
      types: ['master_of_diagonals', 'comeback_king']
    },
    {
      title: "Experience Achievements",
      icon: <Star className="w-5 h-5" />,
      types: ['veteran_player']
    }
  ];

  const getAchievementsByCategory = (types: string[]) => {
    if (!achievements) return [];
    return achievements.filter((achievement: any) => types.includes(achievement.achievementType));
  };

  const allPossibleAchievements = [
    { type: 'first_win', name: 'First Victory', description: 'Win your very first game against any opponent to earn this achievement', icon: '🏆' },
    { type: 'win_streak_5', name: 'Win Streak Master', description: 'Win 5 consecutive games without losing to unlock the Halloween theme', icon: '🔥' },
    { type: 'win_streak_10', name: 'Unstoppable', description: 'Win 10 consecutive games without losing - the ultimate challenge!', icon: '⚡' },
    { type: 'master_of_diagonals', name: 'Master of Diagonals', description: 'Win 3 games by getting three in a row diagonally (corner to corner)', icon: '🎯' },
    { type: 'speed_demon', name: 'Speed Demon', description: 'Win 20 total games to unlock the Christmas theme - keep playing!', icon: '⚡' },
    { type: 'veteran_player', name: 'Veteran Player', description: 'Play 100 total games (wins + losses + draws) to unlock the Summer theme', icon: '🎖️' },
    { type: 'comeback_king', name: 'Comeback King', description: 'Win a game after losing 5 games in a row - prove your resilience!', icon: '👑' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] w-[95vw] sm:w-full mx-auto flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            {userId ? 'Player Achievements' : 'Your Achievements'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 flex-1">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-6 pb-4">
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
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {possibleAchievements.map((possible) => {
                        const earned = categoryAchievements.find((a: any) => a.achievementType === possible.type);
                        
                        if (earned) {
                          return (
                            <AchievementBadge
                              key={earned.id}
                              achievement={earned}
                              size="md"
                            />
                          );
                        } else {
                          // Show locked achievement with tooltip
                          return (
                            <div
                              key={possible.type}
                              className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center opacity-50 cursor-help group relative"
                              title={`🔒 ${possible.name}: ${possible.description}`}
                            >
                              <div className="text-xl mb-1 grayscale">
                                {possible.icon}
                              </div>
                              <div className="text-xs text-center leading-tight text-gray-500">
                                {possible.name}
                              </div>
                              
                              {/* Tooltip for locked achievements */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-red-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 shadow-2xl border border-red-700 w-44 max-w-[90vw] pointer-events-none">
                                <div className="font-bold text-red-300 mb-1 text-center text-xs">🔒 {possible.name}</div>
                                <div className="text-gray-200 text-xs text-center leading-tight">{possible.description}</div>
                                {/* Arrow pointing down */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-red-900"></div>
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
          </ScrollArea>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <Button onClick={onClose} variant="default">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}