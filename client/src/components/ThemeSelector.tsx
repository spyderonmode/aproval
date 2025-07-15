import { useState } from 'react';
import { useTheme, GameTheme } from '@/contexts/ThemeContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Palette, Check } from "lucide-react";

export function ThemeSelector() {
  const { currentTheme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);

  const handleThemeSelect = (theme: GameTheme) => {
    setTheme(theme);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Palette className="h-4 w-4" />
          Theme: {themes[currentTheme].name}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Your Theme</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {Object.entries(themes).map(([key, theme]) => (
            <Card 
              key={key} 
              className={`cursor-pointer transition-all hover:scale-105 ${
                currentTheme === key ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleThemeSelect(key as GameTheme)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  {theme.name}
                  {currentTheme === key && (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-gray-600">{theme.description}</p>
              </CardHeader>
              <CardContent>
                {/* Theme Preview */}
                <div className={`p-4 rounded-lg ${theme.backgroundColor} ${theme.borderColor} border-2`}>
                  <div className={`grid grid-cols-3 gap-1 ${theme.boardStyle} p-2 rounded`}>
                    {Array.from({ length: 9 }, (_, i) => (
                      <div
                        key={i}
                        className={`aspect-square ${theme.cellStyle} rounded text-xs flex items-center justify-center border`}
                      >
                        {i === 0 && <span className={theme.playerXColor}>X</span>}
                        {i === 4 && <span className={theme.playerOColor}>O</span>}
                        {i === 8 && <span className={theme.playerXColor}>X</span>}
                      </div>
                    ))}
                  </div>
                  <div className={`mt-2 text-xs ${theme.textColor} text-center`}>
                    Preview
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}