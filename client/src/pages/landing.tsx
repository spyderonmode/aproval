import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GamepadIcon } from "lucide-react";
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
            <span className="block text-primary">Game</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            Experience the classic game on a 3x5 grid with strategic gameplay.
          </p>
          <Button 
            size="lg" 
            onClick={handleLogin}
            className="bg-primary hover:bg-primary/90 text-lg px-8 py-3"
          >
            Start Playing Now
          </Button>
        </div>
      </div>
    </div>
  );
}