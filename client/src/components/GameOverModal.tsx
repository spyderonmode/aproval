import React from "react";
import { Home, User, RefreshCw } from "lucide-react";
import { useAudio } from "@/hooks/useAudio";
import { SimpleModal } from "./SimpleModal";

interface GameOverModalProps {
  open: boolean;
  onClose: () => void;
  result: any;
  onPlayAgain: () => void;
}

export function GameOverModal({ open, onClose, result, onPlayAgain }: GameOverModalProps) {
  const { playSound } = useAudio();
  
  if (!result) return null;

  const isWin = result.winner;
  const isDraw = result.condition === 'draw';
  const winnerSymbol = result.winner;
  const winnerName = result.winnerName;
  const winnerInfo = result.winnerInfo; // This should contain profile info
  
  // Play celebration sound when modal opens
  React.useEffect(() => {
    if (open && !isDraw) {
      playSound('win');
    }
  }, [open, isDraw, playSound]);

  return (
    <SimpleModal open={open} onClose={onClose}>
      <div style={{ color: 'white', textAlign: 'center' }}>
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
              <div style={{ width: '64px', height: '64px', margin: '0 auto 16px' }}>
                {winnerInfo?.profilePicture ? (
                  <img 
                    src={winnerInfo.profilePicture} 
                    alt="Winner" 
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div 
                    style={{
                      width: '64px',
                      height: '64px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <User style={{ width: '32px', height: '32px', color: 'white' }} />
                  </div>
                )}
              </div>
              
              <p style={{ fontSize: '20px', color: 'white', marginBottom: '16px' }}>
                {winnerInfo?.displayName || winnerInfo?.firstName || winnerInfo?.username || `Player ${winnerSymbol}`} Wins!
              </p>
              
              {result.condition && result.condition !== 'draw' && (
                <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                  {result.condition === 'horizontal' ? 'Horizontal line' : 'Diagonal line'}
                </p>
              )}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            onClick={onClose}
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
            onClick={onPlayAgain}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: '1px solid #2563eb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <RefreshCw style={{ width: '16px', height: '16px' }} />
            Play Again
          </button>
        </div>
      </div>
    </SimpleModal>
  );
}
