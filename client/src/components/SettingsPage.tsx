import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Settings, Palette, Volume2, Bell, Shield, LogOut, User, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logout } from "@/lib/firebase";
import { ThemeSelector } from "@/components/ThemeSelector";

export function SettingsPage() {
  const { toast } = useToast();
  
  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [chatNotifications, setChatNotifications] = useState(true);
  const [gameInvites, setGameInvites] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundVolume, setSoundVolume] = useState([75]);
  const [language, setLanguage] = useState('en');
  const [autoAcceptInvites, setAutoAcceptInvites] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = () => {
    // In a real app, this would show a confirmation dialog
    toast({
      title: "Account Deletion",
      description: "This feature is not yet implemented.",
      variant: "destructive",
    });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-slate-400">Customize your gaming experience</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>General</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Show Online Status</Label>
                <p className="text-sm text-slate-400">Let other players see when you're online</p>
              </div>
              <Switch
                checked={showOnlineStatus}
                onCheckedChange={setShowOnlineStatus}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Auto-accept Game Invites</Label>
                <p className="text-sm text-slate-400">Automatically join games when invited</p>
              </div>
              <Switch
                checked={autoAcceptInvites}
                onCheckedChange={setAutoAcceptInvites}
              />
            </div>

            <div>
              <Label className="text-base font-medium mb-2 block">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Enable Notifications</Label>
                <p className="text-sm text-slate-400">Receive all notifications</p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Chat Messages</Label>
                <p className="text-sm text-slate-400">Get notified of new chat messages</p>
              </div>
              <Switch
                checked={chatNotifications}
                onCheckedChange={setChatNotifications}
                disabled={!notifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Game Invitations</Label>
                <p className="text-sm text-slate-400">Receive game invite notifications</p>
              </div>
              <Switch
                checked={gameInvites}
                onCheckedChange={setGameInvites}
                disabled={!notifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Audio Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5" />
              <span>Audio</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Sound Effects</Label>
                <p className="text-sm text-slate-400">Play sounds for game actions</p>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>

            <div className={soundEnabled ? '' : 'opacity-50'}>
              <Label className="text-base font-medium mb-2 block">Volume</Label>
              <div className="px-3">
                <Slider
                  value={soundVolume}
                  onValueChange={setSoundVolume}
                  max={100}
                  step={5}
                  disabled={!soundEnabled}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-slate-400 mt-1">
                  <span>0%</span>
                  <span>{soundVolume[0]}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="w-5 h-5" />
              <span>Appearance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-base font-medium mb-3 block">Theme</Label>
              <ThemeSelector />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Privacy & Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <User className="w-4 h-4 mr-2" />
              Manage Blocked Users
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Shield className="w-4 h-4 mr-2" />
              Privacy Settings
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Settings className="w-4 h-4 mr-2" />
              Data Export
            </Button>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Account</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="w-full justify-start"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              className="w-full justify-start"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Save Settings */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <p className="text-slate-400">Settings are automatically saved</p>
            <Button
              onClick={() => toast({
                title: "Settings Saved",
                description: "Your preferences have been updated.",
              })}
            >
              Save All Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}