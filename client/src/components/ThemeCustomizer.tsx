import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Palette, RotateCcw, Save } from "lucide-react";

interface ThemeCustomizerProps {
  user: any;
  onClose?: () => void;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

const DEFAULT_THEMES = {
  blue: {
    primary: "#3b82f6",
    secondary: "#1e40af",
    accent: "#60a5fa",
    background: "#1e293b",
    text: "#f1f5f9"
  },
  purple: {
    primary: "#8b5cf6",
    secondary: "#7c3aed",
    accent: "#a78bfa",
    background: "#1e1b4b",
    text: "#f1f5f9"
  },
  green: {
    primary: "#10b981",
    secondary: "#059669",
    accent: "#34d399",
    background: "#064e3b",
    text: "#f0fdf4"
  },
  red: {
    primary: "#ef4444",
    secondary: "#dc2626",
    accent: "#f87171",
    background: "#7f1d1d",
    text: "#fef2f2"
  },
  orange: {
    primary: "#f97316",
    secondary: "#ea580c",
    accent: "#fb923c",
    background: "#7c2d12",
    text: "#fff7ed"
  },
  pink: {
    primary: "#ec4899",
    secondary: "#db2777",
    accent: "#f472b6",
    background: "#831843",
    text: "#fdf2f8"
  }
};

export function ThemeCustomizer({ user, onClose }: ThemeCustomizerProps) {
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof DEFAULT_THEMES>('blue');
  const [customColors, setCustomColors] = useState<ThemeColors>(
    user?.profileTheme ? JSON.parse(user.profileTheme) : DEFAULT_THEMES.blue
  );
  const [isCustomMode, setIsCustomMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateThemeMutation = useMutation({
    mutationFn: async (themeData: ThemeColors) => {
      const response = await apiRequest('PUT', '/api/auth/profile', {
        profileTheme: JSON.stringify(themeData)
      });
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['/api/auth/user'], updatedUser);
      queryClient.invalidateQueries({
        queryKey: ['/api/auth/user']
      });
      toast({
        title: "Theme updated",
        description: "Your profile theme has been updated successfully",
      });
      onClose?.();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePresetTheme = (themeName: keyof typeof DEFAULT_THEMES) => {
    setSelectedTheme(themeName);
    setCustomColors(DEFAULT_THEMES[themeName]);
    setIsCustomMode(false);
  };

  const handleCustomColorChange = (colorKey: keyof ThemeColors, value: string) => {
    setCustomColors(prev => ({
      ...prev,
      [colorKey]: value
    }));
    setIsCustomMode(true);
  };

  const handleSaveTheme = () => {
    updateThemeMutation.mutate(customColors);
  };

  const handleResetToDefault = () => {
    const defaultTheme = DEFAULT_THEMES.blue;
    setCustomColors(defaultTheme);
    setSelectedTheme('blue');
    setIsCustomMode(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Palette className="w-4 h-4 mr-2" />
          Customize Theme
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-500" />
            Customize Profile Theme
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Theme Preview */}
          <Card 
            className="border-2 transition-all duration-200"
            style={{ 
              backgroundColor: customColors.background,
              borderColor: customColors.primary,
              color: customColors.text
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: customColors.primary }}>
                Theme Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: customColors.primary }}
                  ></div>
                  <span>{user?.displayName || user?.username || 'Your Name'}</span>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    style={{ 
                      backgroundColor: customColors.primary,
                      color: customColors.text,
                      border: 'none'
                    }}
                  >
                    Primary Button
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    style={{ 
                      borderColor: customColors.accent,
                      color: customColors.accent,
                      backgroundColor: 'transparent'
                    }}
                  >
                    Secondary
                  </Button>
                </div>
                
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: customColors.secondary }}
                >
                  <p className="text-sm" style={{ color: customColors.text }}>
                    This is how your profile theme will look in the game!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preset Themes */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Preset Themes</Label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(DEFAULT_THEMES).map(([name, theme]) => (
                <button
                  key={name}
                  onClick={() => handlePresetTheme(name as keyof typeof DEFAULT_THEMES)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    selectedTheme === name && !isCustomMode
                      ? 'border-blue-500 ring-2 ring-blue-500/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: theme.background }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: theme.primary }}
                    ></div>
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: theme.secondary }}
                    ></div>
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: theme.accent }}
                    ></div>
                  </div>
                  <p className="text-xs capitalize" style={{ color: theme.text }}>
                    {name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color Picker */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Custom Colors</Label>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(customColors).map(([colorKey, colorValue]) => (
                <div key={colorKey} className="space-y-2">
                  <Label className="text-sm capitalize">{colorKey}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorValue}
                      onChange={(e) => handleCustomColorChange(colorKey as keyof ThemeColors, e.target.value)}
                      className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={colorValue}
                      onChange={(e) => handleCustomColorChange(colorKey as keyof ThemeColors, e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleResetToDefault}
              disabled={updateThemeMutation.isPending}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={updateThemeMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveTheme}
                disabled={updateThemeMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateThemeMutation.isPending ? 'Saving...' : 'Save Theme'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}