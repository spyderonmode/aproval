import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Target, Zap, Crown, Medal, Award, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function AchievementsPage() {
  const { data: userStats } = useQuery({
    queryKey: ["/api/users/online-stats"],
  });

  const achievements = [
    {
      id: 'first_win',
      title: 'First Victory',
      description: 'Win your first game',
      icon: Trophy,
      unlocked: (userStats?.wins || 0) >= 1,
      progress: Math.min((userStats?.wins || 0), 1),
      max: 1,
      rarity: 'common',
      points: 10
    },
    {
      id: 'win_streak_3',
      title: 'Hot Streak',
      description: 'Win 3 games in a row',
      icon: Zap,
      unlocked: (userStats?.winStreak || 0) >= 3,
      progress: Math.min((userStats?.winStreak || 0), 3),
      max: 3,
      rarity: 'uncommon',
      points: 25
    },
    {
      id: 'total_wins_10',
      title: 'Veteran Player',
      description: 'Win 10 total games',
      icon: Medal,
      unlocked: (userStats?.wins || 0) >= 10,
      progress: Math.min((userStats?.wins || 0), 10),
      max: 10,
      rarity: 'rare',
      points: 50
    },
    {
      id: 'perfect_games',
      title: 'Perfect Game',
      description: 'Win without letting opponent score',
      icon: Star,
      unlocked: (userStats?.perfectGames || 0) >= 1,
      progress: Math.min((userStats?.perfectGames || 0), 1),
      max: 1,
      rarity: 'epic',
      points: 75
    },
    {
      id: 'games_played_50',
      title: 'Dedicated',
      description: 'Play 50 total games',
      icon: Target,
      unlocked: (userStats?.totalGames || 0) >= 50,
      progress: Math.min((userStats?.totalGames || 0), 50),
      max: 50,
      rarity: 'rare',
      points: 40
    },
    {
      id: 'champion',
      title: 'Champion',
      description: 'Reach #1 on the leaderboard',
      icon: Crown,
      unlocked: userStats?.rank === 1,
      progress: userStats?.rank === 1 ? 1 : 0,
      max: 1,
      rarity: 'legendary',
      points: 100
    },
    {
      id: 'social_butterfly',
      title: 'Social Butterfly',
      description: 'Send 100 chat messages',
      icon: Award,
      unlocked: (userStats?.chatMessages || 0) >= 100,
      progress: Math.min((userStats?.chatMessages || 0), 100),
      max: 100,
      rarity: 'uncommon',
      points: 30
    }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400 border-gray-400';
      case 'uncommon': return 'text-green-400 border-green-400';
      case 'rare': return 'text-blue-400 border-blue-400';
      case 'epic': return 'text-purple-400 border-purple-400';
      case 'legendary': return 'text-yellow-400 border-yellow-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);
  const totalPossiblePoints = achievements.reduce((sum, a) => sum + a.points, 0);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Achievements</h1>
        <p className="text-slate-400">Track your progress and unlock rewards</p>
      </div>

      {/* Progress Overview */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5" />
            <span>Your Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">{unlockedCount}</div>
              <div className="text-sm text-slate-400">Achievements Unlocked</div>
              <div className="text-xs text-slate-500">{unlockedCount}/{achievements.length}</div>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{totalPoints}</div>
              <div className="text-sm text-slate-400">Achievement Points</div>
              <div className="text-xs text-slate-500">{totalPoints}/{totalPossiblePoints}</div>
            </div>
            <div className="text-center p-4 bg-slate-700 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {Math.round((unlockedCount / achievements.length) * 100)}%
              </div>
              <div className="text-sm text-slate-400">Completion</div>
              <Progress 
                value={(unlockedCount / achievements.length) * 100} 
                className="mt-2 h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => {
          const IconComponent = achievement.icon;
          const rarityColors = getRarityColor(achievement.rarity);
          
          return (
            <Card
              key={achievement.id}
              className={`border-2 transition-all duration-300 ${
                achievement.unlocked
                  ? `bg-slate-800 ${rarityColors} shadow-lg`
                  : 'bg-slate-800/50 border-slate-700 opacity-60'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    achievement.unlocked ? 'bg-primary' : 'bg-slate-700'
                  }`}>
                    {achievement.unlocked ? (
                      <IconComponent className="w-6 h-6 text-white" />
                    ) : (
                      <Lock className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${rarityColors} capitalize`}
                    >
                      {achievement.rarity}
                    </Badge>
                    <div className="text-xs text-slate-400 mt-1">
                      {achievement.points} pts
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className={`font-semibold mb-1 ${
                  achievement.unlocked ? 'text-white' : 'text-slate-400'
                }`}>
                  {achievement.title}
                </h3>
                <p className="text-sm text-slate-400 mb-3">
                  {achievement.description}
                </p>
                
                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Progress</span>
                    <span>{achievement.progress}/{achievement.max}</span>
                  </div>
                  <Progress 
                    value={(achievement.progress / achievement.max) * 100}
                    className="h-2"
                  />
                </div>
                
                {achievement.unlocked && (
                  <Badge className="mt-3 bg-green-600/20 text-green-400 border-green-600">
                    ✓ Unlocked
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Achievement Categories */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle>Achievement Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: 'Common', count: achievements.filter(a => a.rarity === 'common' && a.unlocked).length, total: achievements.filter(a => a.rarity === 'common').length, color: 'text-gray-400' },
              { name: 'Uncommon', count: achievements.filter(a => a.rarity === 'uncommon' && a.unlocked).length, total: achievements.filter(a => a.rarity === 'uncommon').length, color: 'text-green-400' },
              { name: 'Rare', count: achievements.filter(a => a.rarity === 'rare' && a.unlocked).length, total: achievements.filter(a => a.rarity === 'rare').length, color: 'text-blue-400' },
              { name: 'Epic', count: achievements.filter(a => a.rarity === 'epic' && a.unlocked).length, total: achievements.filter(a => a.rarity === 'epic').length, color: 'text-purple-400' },
              { name: 'Legendary', count: achievements.filter(a => a.rarity === 'legendary' && a.unlocked).length, total: achievements.filter(a => a.rarity === 'legendary').length, color: 'text-yellow-400' }
            ].map((category) => (
              <div key={category.name} className="text-center p-3 bg-slate-700 rounded-lg">
                <div className={`text-lg font-bold ${category.color}`}>
                  {category.count}/{category.total}
                </div>
                <div className="text-sm text-slate-400">{category.name}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}