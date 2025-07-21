export default function LoadingScreen() {
  console.log('🚀 LoadingScreen component rendering - creating splash screen');

  return (
    <>
      <style>
        {`
          @keyframes bounce {
            0%, 80%, 100% { 
              transform: scale(0);
            } 40% { 
              transform: scale(1);
            }
          }
        `}
      </style>
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Simple game logo */}
      <div style={{
        width: '120px',
        height: '120px',
        backgroundColor: '#3b82f6',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '30px',
        boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid white',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          ⚡
        </div>
      </div>

      {/* Game title */}
      <h1 style={{
        fontSize: '48px',
        fontWeight: 'bold',
        color: 'white',
        marginBottom: '10px',
        textAlign: 'center'
      }}>
        TicTac 3x5
      </h1>

      <p style={{
        fontSize: '18px',
        color: '#94a3b8',
        marginBottom: '40px',
        textAlign: 'center'
      }}>
        Strategic Tic-Tac-Toe Experience
      </p>

      {/* Loading animation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px'
      }}>
        <div style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'bounce 1.5s ease-in-out infinite'
        }}></div>
        <div style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'bounce 1.5s ease-in-out 0.2s infinite'
        }}></div>
        <div style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'bounce 1.5s ease-in-out 0.4s infinite'
        }}></div>
      </div>

      <p style={{
        fontSize: '14px',
        color: '#64748b',
        marginBottom: '60px',
        textAlign: 'center'
      }}>
        Loading your gaming experience...
      </p>

      {/* Made By DarkLayer Studios */}
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontSize: '20px',
          color: 'white',
          marginBottom: '10px',
          fontWeight: '500'
        }}>
          Made By
        </p>
        <p style={{
          fontSize: '32px',
          fontWeight: 'bold',
          background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #a855f7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          color: 'transparent',
          letterSpacing: '2px',
          marginBottom: '8px'
        }}>
          DarkLayer Studios
        </p>
        <p style={{
          fontSize: '14px',
          color: '#94a3b8',
          fontStyle: 'italic'
        }}>
          Crafting Digital Experiences
        </p>
      </div>
    </div>
    </>
  );
}