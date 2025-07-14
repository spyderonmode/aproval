import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Zap, Trophy, GamepadIcon } from "lucide-react";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  const handleLogin = () => {
    setLocation("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <nav className="px-6 py-4 border-b border-slate-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <GamepadIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">TicTac 3x5</h1>
          </div>
          <Button 
            onClick={handleLogin}
            className="bg-primary hover:bg-primary/90"
          >
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            Strategic Tic-Tac-Toe
            <span className="block text-primary">Reimagined</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            Experience the classic game with a twist! Play on a complete 3x5 grid (positions 1-15) with multiple winning conditions. 
            Challenge AI opponents, compete with friends, or spectate exciting matches.
          </p>
          <Button 
            size="lg" 
            onClick={handleLogin}
            className="bg-primary hover:bg-primary/90 text-lg px-8 py-3"
          >
            Start Playing Now
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="bg-slate-800 border-slate-700 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-white">AI Opponent</CardTitle>
              <CardDescription className="text-slate-400">
                Challenge yourself against intelligent AI with multiple difficulty levels
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-white">Multiplayer Rooms</CardTitle>
              <CardDescription className="text-slate-400">
                Create or join rooms to play with friends and watch as a spectator
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-white">Custom Rules</CardTitle>
              <CardDescription className="text-slate-400">
                Complete 3x5 grid (positions 1-15) with horizontal, vertical, and restricted diagonal wins
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Game Rules */}
        <Card className="bg-slate-800 border-slate-700 max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-white text-2xl text-center">How to Play</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Game Board</h3>
                <p className="text-slate-300 mb-4">
                  Play on a complete 3x5 grid with all positions numbered 1-15.
                  The board offers a full strategic experience with every cell available for play.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Winning Conditions</h3>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Horizontal:</strong> Get 4 symbols in a row horizontally</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Vertical:</strong> Get 3 symbols in a column vertically</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Diagonal:</strong> Get 3 symbols diagonally (positions 5, 10, 15 restricted)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Restriction:</strong> No diagonal wins using rightmost column</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-slate-900 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">Valid Diagonal Patterns</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                <div>
                  <p><strong>Allowed patterns:</strong></p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>[1, 7, 13] - Main diagonal</li>
                    <li>[2, 8, 14] - Main diagonal</li>
                    <li>[3, 7, 11] - Anti-diagonal</li>
                    <li>[4, 8, 12] - Anti-diagonal</li>
                  </ul>
                </div>
                <div>
                  <p><strong>Restricted positions:</strong></p>
                  <p className="mt-2">Positions 5, 10, 15 (rightmost column) cannot be used in diagonal wins</p>
                </div>
              </div>
            </div>
            
            <div className="text-center pt-6">
              <Button 
                onClick={handleLogin}
                className="bg-primary hover:bg-primary/90"
              >
                Ready to Play?
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
