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
    { type: 'first_win', name: 'First Victory', description: 'Win your first game', icon: '🏆' },
    { type: 'win_streak_5', name: 'Win Streak Master', description: 'Win 5 games in a row', icon: '🔥' },
    { type: 'win_streak_10', name: 'Unstoppable', description: 'Win 10 games in a row', icon: '⚡' },
    { type: 'master_of_diagonals', name: 'Master of Diagonals', description: 'Win 3 games with diagonal victories', icon: '🎯' },
    { type: 'speed_demon', name: 'Speed Demon', description: 'Win 20 games total', icon: '⚡' },
    { type: 'veteran_player', name: 'Veteran Player', description: 'Play 100 games total', icon: '🎖️' },
    { type: 'comeback_king', name: 'Comeback King', description: 'Win after losing 5 games in a row', icon: '👑' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            {userId ? 'Player Achievements' : 'Your Achievements'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6">
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
                          // Show locked achievement
                          return (
                            <div
                              key={possible.type}
                              className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center opacity-50 cursor-not-allowed"
                            >
                              <div className="text-xl mb-1 grayscale">
                                {possible.icon}
                              </div>
                              <div className="text-xs text-center leading-tight text-gray-500">
                                {possible.name}
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

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}