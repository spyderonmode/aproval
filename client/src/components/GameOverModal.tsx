import { Home, RefreshCw } from "lucide-react";

interface GameOverModalProps {
  open: boolean;
  onClose: () => void;
  result: any;
  onPlayAgain: () => void;
  isCreatingGame?: boolean;
  onMainMenu?: () => void;
}

export function GameOverModal({ open, onClose, result, onPlayAgain, isCreatingGame = false, onMainMenu }: GameOverModalProps) {
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
  
  // Get proper player names and info
  const getPlayerDisplayName = (symbol: string) => {
    if (symbol === 'X') {
      return result.playerXInfo?.displayName || result.playerXInfo?.firstName || result.playerXInfo?.username || 'Player X';
    } else if (symbol === 'O') {
      return result.playerOInfo?.displayName || result.playerOInfo?.firstName || result.playerOInfo?.username || 'Player O';
    }
    return 'Unknown';
  };
  
  const winnerName = getPlayerDisplayName(winner);
  const winnerInfo = winner === 'X' ? result.playerXInfo : result.playerOInfo;

  return (
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
                  border: '4px solid #fbbf24'
                }}
              >
                {winnerInfo?.profilePicture ? (
                  <img 
                    src={winnerInfo.profilePicture} 
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
              
              {/* Crown icon for winner */}
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '24px' }}>👑</span>
              </div>
              
              <p style={{ fontSize: '20px', color: 'white', marginBottom: '16px' }}>
                {winnerName} Wins!
              </p>
              
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                {result.condition === 'horizontal' ? 'Horizontal line' : 'Diagonal line'}
              </p>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              onClose();
              if (onMainMenu) {
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
  );
}