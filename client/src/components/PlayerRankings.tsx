import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus, User } from "lucide-react";
import { useState } from "react";

interface PlayerRanking {
  userId: string;
  displayName: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  winRate: number;
  rank: number;
  rankChange: number; // +/- change from previous ranking
  streak: number; // current win/loss streak
  streakType: 'win' | 'loss' | 'draw';
}

interface PlayerRankingsProps {
  currentUserId?: string;
}

export function PlayerRankings({ currentUserId }: PlayerRankingsProps) {
  const [sortBy, setSortBy] = useState<'winRate' | 'totalGames' | 'wins'>('winRate');

  const { data: rankings, isLoading } = useQuery({
    queryKey: ['/api/rankings', sortBy],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Player Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getStreakColor = (streakType: string) => {
    switch (streakType) {
      case 'win':
        return 'bg-green-500';
      case 'loss':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return 'text-green-600 dark:text-green-400';
    if (winRate >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Player Rankings
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('winRate')}
              className={`px-3 py-1 rounded text-sm ${
                sortBy === 'winRate' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Win Rate
            </button>
            <button
              onClick={() => setSortBy('wins')}
              className={`px-3 py-1 rounded text-sm ${
                sortBy === 'wins' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Wins
            </button>
            <button
              onClick={() => setSortBy('totalGames')}
              className={`px-3 py-1 rounded text-sm ${
                sortBy === 'totalGames' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Games
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rankings?.map((player: PlayerRanking) => (
            <div
              key={player.userId}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
                player.userId === currentUserId 
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : ''
              }`}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-8 h-8">
                {getRankIcon(player.rank)}
              </div>

              {/* Profile Picture */}
              <div className="relative">
                {player.profileImageUrl ? (
                  <img 
                    src={player.profileImageUrl} 
                    alt={player.displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
                
                {/* Streak indicator */}
                {player.streak > 1 && (
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${getStreakColor(player.streakType)} flex items-center justify-center`}>
                    <span className="text-xs font-bold text-white">{player.streak}</span>
                  </div>
                )}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {player.displayName || `${player.firstName} ${player.lastName}`.trim() || 'Anonymous'}
                  </p>
                  {player.userId === currentUserId && (
                    <Badge variant="outline" className="text-xs">You</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <span className={`font-medium ${getWinRateColor(player.winRate)}`}>
                      {player.winRate.toFixed(1)}%
                    </span>
                    <span>({player.wins}W-{player.losses}L-{player.draws}D)</span>
                  </div>
                  
                  {player.rankChange !== 0 && (
                    <div className="flex items-center gap-1">
                      {getRankChangeIcon(player.rankChange)}
                      <span className="text-xs text-gray-500">
                        {Math.abs(player.rankChange)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Win Rate Progress */}
              <div className="w-20">
                <Progress 
                  value={player.winRate} 
                  className="h-2"
                />
              </div>

              {/* Total Games */}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {player.totalGames}
                </p>
                <p className="text-xs text-gray-500">games</p>
              </div>
            </div>
          ))}
          
          {(!rankings || rankings.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No rankings available yet</p>
              <p className="text-sm">Play some online games to see rankings!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}