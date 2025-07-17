import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Trophy, Target, Calendar, Mail, Edit, Save, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || user?.firstName || '');

  const { data: userStats } = useQuery({
    queryKey: ["/api/users/online-stats"],
    enabled: !!user,
  });

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: displayName,
        }),
      });

      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
        setIsEditing(false);
        // Refresh the page to show updated info
        window.location.reload();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const achievements = [
    { name: 'First Win', unlocked: (userStats?.wins || 0) >= 1 },
    { name: 'Veteran', unlocked: (userStats?.wins || 0) >= 10 },
    { name: 'Champion', unlocked: userStats?.rank === 1 },
    { name: 'Social Player', unlocked: (userStats?.chatMessages || 0) >= 50 }
  ];

  const winRate = userStats?.totalGames > 0 
    ? Math.round((userStats.wins / userStats.totalGames) * 100) 
    : 0;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-slate-400">Manage your account and view your statistics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Profile Information</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {(displayName || user?.username || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="bg-slate-700 border-slate-600"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xl font-semibold">
                        {displayName || user?.username || 'Player'}
                      </h3>
                      <p className="text-slate-400">@{user?.username}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400">Email</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{user?.email || 'Not provided'}</span>
                    {user?.isEmailVerified && (
                      <Badge variant="secondary" className="bg-green-600/20 text-green-400">
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-slate-400">Member Since</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex space-x-2">
                  <Button onClick={handleSaveProfile} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Game Statistics */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Game Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-700 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">
                    {userStats?.wins || 0}
                  </div>
                  <div className="text-sm text-slate-400">Wins</div>
                </div>
                <div className="text-center p-4 bg-slate-700 rounded-lg">
                  <div className="text-2xl font-bold text-red-400">
                    {userStats?.losses || 0}
                  </div>
                  <div className="text-sm text-slate-400">Losses</div>
                </div>
                <div className="text-center p-4 bg-slate-700 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-400">
                    {userStats?.draws || 0}
                  </div>
                  <div className="text-sm text-slate-400">Draws</div>
                </div>
                <div className="text-center p-4 bg-slate-700 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">
                    {winRate}%
                  </div>
                  <div className="text-sm text-slate-400">Win Rate</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Games</span>
                    <span className="font-bold">{userStats?.totalGames || 0}</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Current Streak</span>
                    <span className="font-bold">{userStats?.winStreak || 0}</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Best Streak</span>
                    <span className="font-bold">{userStats?.bestWinStreak || 0}</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Rank</span>
                    <span className="font-bold">#{userStats?.rank || 'Unranked'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements Sidebar */}
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Recent Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-2 rounded-lg ${
                      achievement.unlocked ? 'bg-green-600/20' : 'bg-slate-700/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      achievement.unlocked ? 'bg-green-600' : 'bg-slate-600'
                    }`}>
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        achievement.unlocked ? 'text-white' : 'text-slate-400'
                      }`}>
                        {achievement.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {achievement.unlocked ? 'Unlocked' : 'Locked'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Trophy className="w-4 h-4 mr-2" />
                View All Achievements
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Target className="w-4 h-4 mr-2" />
                Game History
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="w-4 h-4 mr-2" />
                Email Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}