import { useCallback } from 'react';

export const useAudioFile = () => {
  const playAudioFile = useCallback((fileName: string) => {
    try {
      const audio = new Audio(`/audio/${fileName}`);
      audio.volume = 0.5;
      audio.play().catch(e => {
        console.log(`Failed to play ${fileName}:`, e);
      });
    } catch (error) {
      console.log(`Audio file error for ${fileName}:`, error);
    }
  }, []);

  const playCelebrationSound = useCallback(() => {
    playAudioFile('celebration.wav');
  }, [playAudioFile]);

  return { playAudioFile, playCelebrationSound };
};