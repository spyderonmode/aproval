import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Loader2, Users, X, Zap } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";

interface MatchmakingModalProps {
  open: boolean;
  onClose: () => void;
  onMatchFound: (room: any) => void;
  user: any;
}

export function MatchmakingModal({ open, onClose, onMatchFound, user }: MatchmakingModalProps) {
  const { t } = useTranslation();
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [queuePosition, setQueuePosition] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  const joinMatchmakingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/matchmaking/join', { method: 'POST', body: {} });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.status === 'matched') {
        setIsSearching(false);
        // Server automatically handles room joining, just close modal
        onClose();
        toast({
          title: t('matchFound'),
          description: t('matchedWithOpponent'),
        });
      } else if (data.status === 'waiting') {
        setIsSearching(true);
        setQueuePosition(1);
        toast({
          title: t('searchingForOpponent'),
          description: t('lookingForPlayer'),
        });
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: t('unauthorized'),
          description: t('loggedOutLoggingIn'),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
      setIsSearching(false);
    },
  });

  const leaveMatchmakingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/matchmaking/leave', { method: 'POST', body: {} });
      return response.json();
    },
    onSuccess: () => {
      setIsSearching(false);
      setSearchTime(0);
      setQueuePosition(0);
      toast({
        title: t('leftQueue'),
        description: t('leftMatchmakingQueue'),
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStartSearch = () => {
    setSearchTime(0);
    setQueuePosition(0);
    joinMatchmakingMutation.mutate();
  };

  const handleCancelSearch = () => {
    leaveMatchmakingMutation.mutate();
  };

  const handleClose = () => {
    if (isSearching) {
      handleCancelSearch();
    }
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            {t('quickMatch')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!isSearching && !joinMatchmakingMutation.isPending ? (
            <div className="text-center space-y-4">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                <Users className="h-12 w-12 mx-auto text-blue-500 mb-3" />
                <h3 className="font-semibold text-lg mb-2">{t('readyToPlay')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('findAnotherPlayerCompete')}
                </p>
              </div>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{t('onlinePlayersLookingForMatches')}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {t('averageMatchTime')}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Button 
                onClick={handleStartSearch}
                className="w-full"
                size="lg"
              >
                <Zap className="h-4 w-4 mr-2" />
                {t('findMatch')}
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg">
                <div className="flex items-center justify-center mb-4">
                  <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{t('searchingForOpponent')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('lookingForPlayer')}
                </p>
              </div>
              
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('searchTime')}</span>
                      <span className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                        {formatTime(searchTime)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('status')}</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-yellow-600 dark:text-yellow-400">
                          {t('searching')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((searchTime / 30) * 100, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-xs text-gray-500 text-center">
                      {searchTime < 10 ? t('findingPerfectOpponent') : 
                       searchTime < 20 ? t('expandingSearch') : 
                       t('almostThere')}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Button 
                onClick={handleCancelSearch}
                variant="outline"
                className="w-full"
                disabled={leaveMatchmakingMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                {t('cancel')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}