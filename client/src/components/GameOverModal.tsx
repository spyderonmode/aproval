import { Home, User, RefreshCw } from "lucide-react";

interface GameOverModalProps {
  open: boolean;
  onClose: () => void;
  result: any;
  onPlayAgain: () => void;
  isCreatingGame?: boolean;
  onMainMenu?: () => void;
}

export function GameOverModal({ open, onClose, result, onPlayAgain, isCreatingGame = false, onMainMenu }: GameOverModalProps) {
  // Always check if we have open and result before rendering
  if (!open) return null;
  if (!result) {
    console.error('GameOverModal: No result provided');
    return null;
  }
  
  console.log('GameOverModal rendering with result:', result);

  const isDraw = result.condition === 'draw';
  const winnerSymbol = result.winner;
  const winnerInfo = result.winnerInfo || (winnerSymbol === 'X' ? result.playerXInfo : result.playerOInfo);

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
              <div style={{ width: '64px', height: '64px', margin: '0 auto 16px' }}>
                {winnerInfo?.profileImageUrl || winnerInfo?.profilePicture ? (
                  <img 
                    src={winnerInfo.profileImageUrl || winnerInfo.profilePicture} 
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
                {result.winnerName || `Player ${winnerSymbol}`} Wins!
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
