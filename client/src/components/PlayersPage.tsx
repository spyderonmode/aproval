import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Search, MessageCircle, GamepadIcon, UserPlus, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface PlayersPageProps {
  onPageChange: (page: string) => void;
}

interface Player {
  userId: string;
  username: string;
  displayName?: string;
  isOnline: boolean;
  wins?: number;
  totalGames?: number;
  lastSeen?: string;
}

export function PlayersPage({ onPageChange }: PlayersPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  const { data: players = [], isLoading } = useQuery({
    queryKey: ["/api/users/online"],
    refetchInterval: 5000,
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["/api/users/leaderboard"],
    refetchInterval: 30000,
  });

  const filteredPlayers = players.filter((player: Player) =>
    player.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (player.displayName && player.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleChatWithPlayer = (player: Player) => {
    // Navigate to chat page and select this player
    onPageChange('chat');
    // You could also dispatch an event to pre-select the player
    window.dispatchEvent(new CustomEvent('selectChatUser', { detail: player }));
  };

  const handleInviteToGame = (player: Player) => {
    // Navigate to game page and potentially start matchmaking
    onPageChange('game');
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Players</h1>
        <p className="text-slate-400">Find and connect with other players</p>
      </div>

      {/* Search */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Online Players */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Online Players</span>
              <Badge variant="secondary" className="bg-green-600/20 text-green-400">
                {filteredPlayers.filter((p: Player) => p.isOnline).length} online
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 p-4">
                {isLoading ? (
                  <div className="text-center py-8 text-slate-400">
                    Loading players...
                  </div>
                ) : filteredPlayers.filter((p: Player) => p.isOnline).length > 0 ? (
                  filteredPlayers
                    .filter((p: Player) => p.isOnline)
                    .map((player: Player) => (
                      <div
                        key={player.userId}
                        className="flex items-center justify-between p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center relative">
                            <span className="font-bold">
                              {(player.displayName || player.username).charAt(0).toUpperCase()}
                            </span>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-700" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {player.displayName || player.username}
                            </p>
                            <p className="text-sm text-slate-400">
                              {player.wins || 0} wins • {player.totalGames || 0} games
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChatWithPlayer(player)}
                            className="p-2"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleInviteToGame(player)}
                            className="p-2"
                          >
                            <GamepadIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No online players found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span>Leaderboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 p-4">
                {leaderboard.length > 0 ? (
                  leaderboard.map((player: Player, index: number) => (
                    <div
                      key={player.userId}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index === 0 ? 'bg-yellow-600/20 border border-yellow-600/30' :
                        index === 1 ? 'bg-gray-600/20 border border-gray-600/30' :
                        index === 2 ? 'bg-orange-600/20 border border-orange-600/30' :
                        'bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          index === 2 ? 'bg-orange-500 text-black' :
                          'bg-slate-600 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center relative">
                          <span className="text-xs font-bold">
                            {(player.displayName || player.username).charAt(0).toUpperCase()}
                          </span>
                          {player.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {player.displayName || player.username}
                          </p>
                          <p className="text-xs text-slate-400">
                            {player.wins || 0} wins • {Math.round(((player.wins || 0) / (player.totalGames || 1)) * 100)}% win rate
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{player.wins || 0}</p>
                        <p className="text-xs text-slate-400">wins</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Crown className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No leaderboard data yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => onPageChange('chat')}
              className="h-12"
              variant="outline"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Open Chat
            </Button>
            <Button
              onClick={() => onPageChange('game')}
              className="h-12"
            >
              <GamepadIcon className="w-4 h-4 mr-2" />
              Find Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}