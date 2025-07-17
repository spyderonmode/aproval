import { useState, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  message: string;
  progress?: number;
  variant?: 'tictactoe' | 'gameboard' | 'progress';
}

export const useLoadingState = (initialState: Partial<LoadingState> = {}) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: 'Loading...',
    variant: 'tictactoe',
    ...initialState
  });

  const startLoading = useCallback((
    message: string = 'Loading...',
    variant: 'tictactoe' | 'gameboard' | 'progress' = 'tictactoe',
    progress?: number
  ) => {
    setLoadingState({
      isLoading: true,
      message,
      variant,
      progress
    });
  }, []);

  const updateProgress = useCallback((progress: number, message?: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress,
      ...(message && { message })
    }));
  }, []);

  const updateMessage = useCallback((message: string) => {
    setLoadingState(prev => ({
      ...prev,
      message
    }));
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false
    }));
  }, []);

  return {
    ...loadingState,
    startLoading,
    updateProgress,
    updateMessage,
    stopLoading
  };
};

export default useLoadingState;