import { useCallback } from 'react';

export const useConfettiSound = () => {
  const playExplosionSound = useCallback(() => {
    try {
      // Create a simple celebration sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create multiple tones for a celebration effect
      const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6
      const duration = 0.8;
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.type = 'sine';
        
        // Fade in and out
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime + index * 0.1);
        oscillator.stop(audioContext.currentTime + duration);
      });
      
      // Add some noise burst for sparkle effect
      const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.3, audioContext.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * 0.05; // Low volume white noise
      }
      
      const noiseSource = audioContext.createBufferSource();
      const noiseGain = audioContext.createGain();
      
      noiseSource.buffer = noiseBuffer;
      noiseSource.connect(noiseGain);
      noiseGain.connect(audioContext.destination);
      
      noiseGain.gain.setValueAtTime(0.3, audioContext.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      noiseSource.start(audioContext.currentTime);
      
    } catch (error) {
      console.log('Audio not supported or failed:', error);
    }
  }, []);

  return { playExplosionSound };
};