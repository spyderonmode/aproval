import React, { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  gravity: number;
}

interface ConfettiExplosionProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
  colors?: string[];
}

export function ConfettiExplosion({ 
  active, 
  duration = 3000, 
  particleCount = 100,
  colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe']
}: ConfettiExplosionProps) {
  const [particles, setParticles] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (active) {
      // Create confetti pieces
      const newParticles: ConfettiPiece[] = [];
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = 5 + Math.random() * 10;
        
        newParticles.push({
          id: i,
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - Math.random() * 5,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 4 + Math.random() * 6,
          gravity: 0.3 + Math.random() * 0.2
        });
      }
      
      setParticles(newParticles);
      setIsVisible(true);
      
      // Animation loop
      let animationId: number;
      const animate = () => {
        setParticles(prevParticles => 
          prevParticles.map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vx: particle.vx * 0.99,
            vy: particle.vy + particle.gravity,
            rotation: particle.rotation + particle.rotationSpeed
          }))
        );
        
        animationId = requestAnimationFrame(animate);
      };
      
      animate();
      
      // Clean up after duration
      const timeout = setTimeout(() => {
        setIsVisible(false);
        cancelAnimationFrame(animationId);
        setTimeout(() => setParticles([]), 1000);
      }, duration);
      
      return () => {
        clearTimeout(timeout);
        cancelAnimationFrame(animationId);
      };
    }
  }, [active, duration, particleCount, colors]);

  if (!isVisible || particles.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10000
      }}
    >
      {particles.map(particle => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0%',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 1s ease-out'
          }}
        />
      ))}
    </div>
  );
}