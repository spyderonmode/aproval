import { useCallback } from 'react';

export const useConfettiSound = () => {
  const playExplosionSound = useCallback(() => {
    try {
      // Check if Web Audio API is supported
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        console.log('Web Audio API not supported');
        return;
      }

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context if suspended (required for some browsers)
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          playSimpleSound(audioContext);
        });
      } else {
        playSimpleSound(audioContext);
      }
      
    } catch (error) {
      console.log('Audio failed:', error);
    }
  }, []);

  const playSimpleSound = (audioContext: AudioContext) => {
    try {
      // Create a simple celebration sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Play a happy chord progression
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.2); // E5
      oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.4); // G5
      
      oscillator.type = 'sine';
      
      // Volume control
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.8);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);
      
    } catch (error) {
      console.log('Simple sound failed:', error);
    }
  };

  return { playExplosionSound };
};