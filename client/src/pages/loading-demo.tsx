import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TicTacToeLoader } from '@/components/TicTacToeLoader';
import { GameBoardLoader } from '@/components/GameBoardLoader';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ProgressBar } from '@/components/ProgressBar';
import { useLoadingState } from '@/hooks/useLoadingState';
import { ArrowLeft, Play, Pause, RefreshCw } from 'lucide-react';
import { useLocation } from 'wouter';

export default function LoadingDemo() {
  const [, setLocation] = useLocation();
  const [progress, setProgress] = useState(0);
  const [isProgressRunning, setIsProgressRunning] = useState(false);
  const [fullscreenDemo, setFullscreenDemo] = useState<'tictactoe' | 'gameboard' | 'progress' | null>(null);
  
  const loadingState = useLoadingState();

  // Simulate progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProgressRunning && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsProgressRunning(false);
            return 100;
          }
          return prev + 1;
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isProgressRunning, progress]);

  const resetProgress = () => {
    setProgress(0);
    setIsProgressRunning(false);
  };

  const startProgress = () => {
    setIsProgressRunning(true);
  };

  const pauseProgress = () => {
    setIsProgressRunning(false);
  };

  const showFullscreenDemo = (variant: 'tictactoe' | 'gameboard' | 'progress') => {
    setFullscreenDemo(variant);
    loadingState.startLoading(
      variant === 'tictactoe' ? 'Loading game...' :
      variant === 'gameboard' ? 'Initializing game board...' :
      'Processing...',
      variant,
      variant === 'progress' ? progress : undefined
    );
  };

  const closeFullscreenDemo = () => {
    setFullscreenDemo(null);
    loadingState.stopLoading();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => setLocation('/')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              Loading Components Demo
            </h1>
            <p className="text-slate-300 text-lg">
              Playful tic-tac-toe themed loading indicators and animations
            </p>
          </div>
        </div>

        {/* Loading Spinners */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-white">Loading Spinners</CardTitle>
            <CardDescription>
              Various loading spinner styles and sizes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center space-y-4">
                <h3 className="text-white font-medium">Default</h3>
                <div className="flex justify-center items-center space-x-4">
                  <LoadingSpinner size="sm" className="text-blue-400" />
                  <LoadingSpinner size="md" className="text-blue-400" />
                  <LoadingSpinner size="lg" className="text-blue-400" />
                </div>
              </div>
              
              <div className="text-center space-y-4">
                <h3 className="text-white font-medium">Grid</h3>
                <div className="flex justify-center items-center space-x-4">
                  <LoadingSpinner variant="grid" size="sm" className="text-green-400" />
                  <LoadingSpinner variant="grid" size="md" className="text-green-400" />
                  <LoadingSpinner variant="grid" size="lg" className="text-green-400" />
                </div>
              </div>
              
              <div className="text-center space-y-4">
                <h3 className="text-white font-medium">Dots</h3>
                <div className="flex justify-center items-center space-x-4">
                  <LoadingSpinner variant="dots" size="sm" className="text-purple-400" />
                  <LoadingSpinner variant="dots" size="md" className="text-purple-400" />
                  <LoadingSpinner variant="dots" size="lg" className="text-purple-400" />
                </div>
              </div>
              
              <div className="text-center space-y-4">
                <h3 className="text-white font-medium">Pulse</h3>
                <div className="flex justify-center items-center space-x-4">
                  <LoadingSpinner variant="pulse" size="sm" className="text-red-400" />
                  <LoadingSpinner variant="pulse" size="md" className="text-red-400" />
                  <LoadingSpinner variant="pulse" size="lg" className="text-red-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tic-Tac-Toe Loaders */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-white">Tic-Tac-Toe Loaders</CardTitle>
            <CardDescription>
              Animated tic-tac-toe boards with different speeds and sizes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="text-center space-y-4">
                <h3 className="text-white font-medium">Small / Fast</h3>
                <TicTacToeLoader size="sm" speed="fast" />
                <Button onClick={() => showFullscreenDemo('tictactoe')}>
                  View Fullscreen
                </Button>
              </div>
              
              <div className="text-center space-y-4">
                <h3 className="text-white font-medium">Medium / Normal</h3>
                <TicTacToeLoader size="md" speed="normal" />
              </div>
              
              <div className="text-center space-y-4">
                <h3 className="text-white font-medium">Large / Slow</h3>
                <TicTacToeLoader size="lg" speed="slow" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Board Loader */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-white">Game Board Loader</CardTitle>
            <CardDescription>
              3x5 grid loader matching the actual game board
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <GameBoardLoader message="Initializing game board..." />
              <Button onClick={() => showFullscreenDemo('gameboard')}>
                View Fullscreen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress Bars */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-white">Progress Bars</CardTitle>
            <CardDescription>
              Different progress bar styles including tic-tac-toe themed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-center space-x-4 mb-4">
                <Button onClick={startProgress} disabled={isProgressRunning}>
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </Button>
                <Button onClick={pauseProgress} disabled={!isProgressRunning}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
                <Button onClick={resetProgress}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={() => showFullscreenDemo('progress')}>
                  View Fullscreen
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-white font-medium mb-2">Default Progress Bar</h3>
                  <ProgressBar progress={progress} showPercentage />
                </div>
                
                <div>
                  <h3 className="text-white font-medium mb-2">Gradient Progress Bar</h3>
                  <ProgressBar progress={progress} variant="gradient" showPercentage />
                </div>
                
                <div>
                  <h3 className="text-white font-medium mb-2">Tic-Tac-Toe Progress Bar</h3>
                  <ProgressBar progress={progress} variant="tictactoe" showPercentage />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-white">Usage Examples</CardTitle>
            <CardDescription>
              How these components are used throughout the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-slate-300 space-y-4">
              <div className="p-4 bg-slate-800 rounded-lg">
                <h4 className="font-medium text-white mb-2">Authentication</h4>
                <p className="text-sm">Loading dots appear on login/register buttons while processing credentials</p>
              </div>
              
              <div className="p-4 bg-slate-800 rounded-lg">
                <h4 className="font-medium text-white mb-2">Friend Search</h4>
                <p className="text-sm">Loading spinner shows while searching for users by name</p>
              </div>
              
              <div className="p-4 bg-slate-800 rounded-lg">
                <h4 className="font-medium text-white mb-2">Matchmaking</h4>
                <p className="text-sm">Animated tic-tac-toe loader with gradient progress bar during opponent search</p>
              </div>
              
              <div className="p-4 bg-slate-800 rounded-lg">
                <h4 className="font-medium text-white mb-2">Game Initialization</h4>
                <p className="text-sm">3x5 game board loader appears when starting new games</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fullscreen Loading Demo */}
      {fullscreenDemo && loadingState.isLoading && (
        <LoadingScreen
          variant={fullscreenDemo}
          message={loadingState.message}
          progress={loadingState.progress}
          fullscreen={true}
        />
      )}
    </div>
  );
}