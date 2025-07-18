import React from "react";
import { Home, RefreshCw, Volume2 } from "lucide-react";
import { useClickAudio } from '@/hooks/useClickAudio';

interface GameOverModalProps {
  open: boolean;
  onClose: () => void;
  result: any;
  onPlayAgain: () => void;
  isCreatingGame?: boolean;
  onMainMenu?: () => void;
}

export function GameOverModal({ open, onClose, result, onPlayAgain, isCreatingGame = false, onMainMenu }: GameOverModalProps) {
  const { playSound, initAudio } = useClickAudio();
  
  // Simple safety checks
  if (!open) return null;
  if (!result) {
    console.error('GameOverModal: No result provided');
    return null;
  }
  
  console.log('GameOverModal rendering with result:', result);

  // Super simple logic - no complex conditionals
  const isDraw = result.condition === 'draw';
  const winner = result.winner;
  
  // Get proper player names and info - only for online games
  const isOnlineGame = result.game?.gameMode === 'online';
  
  const getPlayerDisplayName = (symbol: string) => {
    if (!isOnlineGame) {
      // For AI and pass-play modes, use simple names
      if (symbol === 'X') return 'Player X';
      if (symbol === 'O') return result.game?.gameMode === 'ai' ? 'AI' : 'Player O';
      return 'Unknown';
    }
    
    // For online games, use actual player info
    if (symbol === 'X') {
      const playerX = result.playerXInfo;
      return playerX?.displayName || playerX?.firstName || playerX?.username || 'Player X';
    } else if (symbol === 'O') {
      const playerO = result.playerOInfo;
      return playerO?.displayName || playerO?.firstName || playerO?.username || 'Player O';
    }
    return 'Unknown';
  };
  
  const winnerName = getPlayerDisplayName(winner);
  const winnerInfo = isOnlineGame ? (winner === 'X' ? result.playerXInfo : result.playerOInfo) : null;

  return (
    <>
      {/* Sparkle explosion effect for wins */}
      {open && !isDraw && winner && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10000
        }}>
          {/* Generate 60 sparkles that explode outward from center */}
          {Array.from({ length: 60 }, (_, i) => {
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe', '#00b894', '#e17055'];
            const size = Math.random() * 10 + 3; // 3-13px
            const angle = (360 / 60) * i + Math.random() * 20; // Spread around 360 degrees
            const distance = Math.random() * 300 + 150; // 150-450px from center
            const duration = Math.random() * 1.5 + 1.5; // 1.5-3s animation
            const delay = Math.random() * 0.3; // 0-0.3s delay
            
            // Calculate final position based on angle and distance
            const radian = (angle * Math.PI) / 180;
            const dx = Math.cos(radian) * distance;
            const dy = Math.sin(radian) * distance;
            
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                  borderRadius: '50%',
                  animation: `sparkle-explode ${duration}s ease-out ${delay}s forwards`,
                  boxShadow: `0 0 ${size * 2}px ${colors[Math.floor(Math.random() * colors.length)]}`,
                  transform: 'translate(-50%, -50%)',
                  '--dx': `${dx}px`,
                  '--dy': `${dy}px`
                } as React.CSSProperties}
              />
            );
          })}
        </div>
      )}
      
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}
        onClick={onClose}
      >
      <div 
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #475569',
          color: 'white',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes winner-pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); }
            100% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); }
          }
          @keyframes sparkle-explode {
            0% {
              transform: translate(-50%, -50%) scale(0);
              opacity: 1;
            }
            20% {
              transform: translate(-50%, -50%) scale(1.5);
              opacity: 1;
            }
            100% {
              transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.3);
              opacity: 0;
            }
          }
        `}</style>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: 'white' }}>
          Game Over!
        </h2>
        
        <div style={{ marginBottom: '24px' }}>
          {isDraw ? (
            <div>
              <div 
                style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 16px',
                  backgroundColor: '#eab308',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span style={{ fontSize: '32px' }}>🤝</span>
              </div>
              <p style={{ fontSize: '20px', color: '#d1d5db' }}>It's a Draw!</p>
            </div>
          ) : (
            <div>
              {/* Winner profile picture or symbol */}
              <div 
                style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 16px',
                  backgroundColor: winner === 'X' ? '#3b82f6' : '#ef4444',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '4px solid #fbbf24',
                  animation: 'winner-pulse 1s ease-in-out infinite alternate'
                }}
              >
                {isOnlineGame && (winnerInfo?.profilePicture || winnerInfo?.profileImageUrl) ? (
                  <img 
                    src={winnerInfo.profilePicture || winnerInfo.profileImageUrl} 
                    alt={winnerName}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '32px', color: 'white', fontWeight: 'bold' }}>
                    {winner}
                  </span>
                )}
              </div>
              
              <p style={{ fontSize: '20px', color: 'white', marginBottom: '16px' }}>
                {winnerName} Wins!
              </p>
              
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                {result.condition === 'horizontal' ? 'Horizontal line' : 'Diagonal line'}
              </p>
              
              {/* Sound button for celebration */}
              <button
                onClick={() => {
                  initAudio();
                  playSound();
                }}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px'
                }}
              >
                <Volume2 size={16} />
                Play Celebration
              </button>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              console.log('🏠 Main Menu button clicked from GameOverModal');
              onClose();
              if (onMainMenu) {
                console.log('🏠 Calling onMainMenu from GameOverModal');
                onMainMenu();
              }
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#374151',
              color: 'white',
              border: '1px solid #6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Home style={{ width: '16px', height: '16px' }} />
            Main Menu
          </button>
          <button
            onClick={() => {
              if (!isCreatingGame) {
                onPlayAgain();
              }
            }}
            disabled={isCreatingGame}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: isCreatingGame ? '#6b7280' : '#3b82f6',
              color: 'white',
              border: isCreatingGame ? '1px solid #6b7280' : '1px solid #2563eb',
              cursor: isCreatingGame ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: isCreatingGame ? 0.6 : 1
            }}
          >
            <RefreshCw style={{ width: '16px', height: '16px' }} />
            Play Again
          </button>
        </div>
      </div>
    </div>
    </>
  );
}