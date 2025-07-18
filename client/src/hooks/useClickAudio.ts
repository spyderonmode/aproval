import { useCallback, useRef } from 'react';

export const useClickAudio = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const initAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/audio/celebration.wav');
      audioRef.current.volume = 0.5;
      audioRef.current.preload = 'auto';
    }
  }, []);

  const playSound = useCallback(() => {
    try {
      initAudio();
      if (audioRef.current) {
        audioRef.current.currentTime = 0; // Reset to beginning
        audioRef.current.play().catch(err => {
          console.log('Audio play blocked:', err);
        });
      }
    } catch (error) {
      console.log('Audio error:', error);
    }
  }, [initAudio]);

  return { playSound, initAudio };
};