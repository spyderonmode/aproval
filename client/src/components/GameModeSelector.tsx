import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Users, GamepadIcon } from "lucide-react";

interface GameModeSelectorProps {
  selectedMode: 'ai' | 'pass-play' | 'online';
  onModeChange: (mode: 'ai' | 'pass-play' | 'online') => void;
}

export function GameModeSelector({ selectedMode, onModeChange }: GameModeSelectorProps) {
  const modes = [
    {
      id: 'ai' as const,
      name: 'Play vs AI',
      icon: Bot,
      description: 'Challenge the computer'
    },
    {
      id: 'pass-play' as const,
      name: 'Pass & Play',
      icon: GamepadIcon,
      description: 'Local multiplayer'
    },
    {
      id: 'online' as const,
      name: 'Online Match',
      icon: Users,
      description: 'Play with friends online'
    }
  ];

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg">Game Mode</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          
          return (
            <Button
              key={mode.id}
              variant={isSelected ? "default" : "outline"}
              className={`w-full justify-start p-4 h-auto ${
                isSelected 
                  ? 'bg-primary hover:bg-primary/90 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 border-slate-600'
              }`}
              onClick={() => onModeChange(mode.id)}
            >
              <Icon className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">{mode.name}</div>
                <div className="text-sm opacity-75">{mode.description}</div>
              </div>
              {isSelected && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
              )}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
