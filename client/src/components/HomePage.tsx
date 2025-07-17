import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GamepadIcon, Users, Trophy, MessageCircle, Play, Zap, Target, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface HomePageProps {
  onPageChange: (page: string) => void;
  onlineUserCount: number;
}

export function HomePage({ onPageChange, onlineUserCount }: HomePageProps) {
  const { user } = useAuth();

  const { data: userStats } = useQuery({
    queryKey: ["/api/users/online-stats"],
    enabled: !!user,
  });

  const quickActions = [
    {
      id: 'game',
      title: 'Quick Play',
      description: 'Start a game instantly',
      icon: Play,
      color: 'bg-green-600',
      action: () => onPageChange('game')
    },
    {
      id: 'chat',
      title: 'Chat',
      description: `${onlineUserCount} players online`,
      icon: MessageCircle,
      color: 'bg-blue-600',
      badge: onlineUserCount > 0 ? onlineUserCount.toString() : undefined,
      action: () => onPageChange('chat')
    },
    {
      id: 'players',
      title: 'Find Players',
      description: 'Browse online players',
      icon: Users,
      color: 'bg-purple-600',
      action: () => onPageChange('players')
    },
    {
      id: 'achievements',
      title: 'Achievements',
      description: 'View your progress',
      icon: Trophy,
      color: 'bg-yellow-600',
      action: () => onPageChange('achievements')
    }
  ];

  const gameStats = [
    {
      label: 'Wins',
      value: userStats?.wins || 0,
      icon: Trophy,
      color: 'text-green-400'
    },
    {
      label: 'Games Played',
      value: userStats?.totalGames || 0,
      icon: GamepadIcon,
      color: 'text-blue-400'
    },
    {
      label: 'Win Rate',
      value: userStats?.totalGames > 0 ? `${Math.round((userStats.wins / userStats.totalGames) * 100)}%` : '0%',
      icon: Target,
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.displayName || user?.firstName || user?.username || 'Player'}!
        </h1>
        <p className="text-slate-400 text-lg">Ready for your next game?</p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const IconComponent = action.icon;
          return (
            <Card
              key={action.id}
              className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer group"
              onClick={action.action}
            >
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1 flex items-center justify-center space-x-2">
                  <span>{action.title}</span>
                  {action.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {action.badge}
                    </Badge>
                  )}
                </h3>
                <p className="text-sm text-slate-400">{action.description}</p>
                <ChevronRight className="w-4 h-4 mx-auto mt-2 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Game Statistics */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5" />
            <span>Your Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {gameStats.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <div key={stat.label} className="text-center p-4 bg-slate-700 rounded-lg">
                  <IconComponent className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Quick Start</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => onPageChange('game')}
            className="w-full h-12 text-lg"
            size="lg"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Playing Now
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => onPageChange('chat')}
              className="h-10"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
            <Button
              variant="outline"
              onClick={() => onPageChange('players')}
              className="h-10"
            >
              <Users className="w-4 h-4 mr-2" />
              Players
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Online Status */}
      {onlineUserCount > 0 && (
        <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-green-400 font-medium">
                  {onlineUserCount} players online right now
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange('chat')}
                className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
              >
                Join Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}