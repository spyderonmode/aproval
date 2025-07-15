import React, { createContext, useContext, useState, useEffect } from 'react';

export type GameTheme = 'default' | 'neon' | 'retro' | 'minimalist' | 'nature' | 'space';

interface ThemeContextType {
  currentTheme: GameTheme;
  setTheme: (theme: GameTheme) => void;
  themes: Record<GameTheme, {
    name: string;
    description: string;
    boardStyle: string;
    cellStyle: string;
    cellHoverStyle: string;
    playerXColor: string;
    playerOColor: string;
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    winningCellStyle: string;
  }>;
}

const themes = {
  default: {
    name: 'Default',
    description: 'Classic dark theme',
    boardStyle: 'bg-slate-800 border-slate-700',
    cellStyle: 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600',
    cellHoverStyle: 'hover:bg-slate-600',
    playerXColor: 'text-blue-400',
    playerOColor: 'text-red-400',
    backgroundColor: 'bg-slate-900',
    textColor: 'text-white',
    borderColor: 'border-slate-700',
    winningCellStyle: 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-400/50'
  },
  neon: {
    name: 'Neon',
    description: 'Cyberpunk neon glow',
    boardStyle: 'bg-black border-cyan-500 shadow-lg shadow-cyan-500/20',
    cellStyle: 'bg-gray-900 border-cyan-400 text-cyan-300 hover:bg-cyan-900/30 hover:border-cyan-300 hover:shadow-cyan-400/50',
    cellHoverStyle: 'hover:bg-cyan-900/30 hover:border-cyan-300 hover:shadow-cyan-400/50',
    playerXColor: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]',
    playerOColor: 'text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]',
    backgroundColor: 'bg-black',
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-500',
    winningCellStyle: 'bg-gradient-to-br from-cyan-400 to-pink-500 shadow-lg shadow-cyan-400/50 border-cyan-300'
  },
  retro: {
    name: 'Retro',
    description: 'Vintage arcade style',
    boardStyle: 'bg-amber-900 border-amber-600 shadow-lg',
    cellStyle: 'bg-amber-800 border-amber-500 text-amber-100 hover:bg-amber-700',
    cellHoverStyle: 'hover:bg-amber-700',
    playerXColor: 'text-yellow-300 font-bold',
    playerOColor: 'text-orange-300 font-bold',
    backgroundColor: 'bg-amber-950',
    textColor: 'text-amber-100',
    borderColor: 'border-amber-600',
    winningCellStyle: 'bg-gradient-to-br from-yellow-400 to-orange-600 shadow-lg shadow-yellow-400/50'
  },
  minimalist: {
    name: 'Minimalist',
    description: 'Clean and simple',
    boardStyle: 'bg-white border-gray-300 shadow-md',
    cellStyle: 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100',
    cellHoverStyle: 'hover:bg-gray-100',
    playerXColor: 'text-indigo-600',
    playerOColor: 'text-rose-600',
    backgroundColor: 'bg-gray-50',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-300',
    winningCellStyle: 'bg-gradient-to-br from-indigo-100 to-rose-100 border-indigo-300'
  },
  nature: {
    name: 'Nature',
    description: 'Earth tones and natural colors',
    boardStyle: 'bg-green-900 border-green-700 shadow-lg',
    cellStyle: 'bg-green-800 border-green-600 text-green-100 hover:bg-green-700',
    cellHoverStyle: 'hover:bg-green-700',
    playerXColor: 'text-emerald-300',
    playerOColor: 'text-amber-300',
    backgroundColor: 'bg-green-950',
    textColor: 'text-green-100',
    borderColor: 'border-green-700',
    winningCellStyle: 'bg-gradient-to-br from-emerald-400 to-amber-500 shadow-lg shadow-emerald-400/50'
  },
  space: {
    name: 'Space',
    description: 'Deep space adventure',
    boardStyle: 'bg-indigo-950 border-purple-600 shadow-lg shadow-purple-600/20',
    cellStyle: 'bg-indigo-900 border-purple-500 text-purple-100 hover:bg-purple-900/50',
    cellHoverStyle: 'hover:bg-purple-900/50',
    playerXColor: 'text-blue-300 drop-shadow-[0_0_6px_rgba(147,197,253,0.6)]',
    playerOColor: 'text-purple-300 drop-shadow-[0_0_6px_rgba(196,181,253,0.6)]',
    backgroundColor: 'bg-indigo-950',
    textColor: 'text-purple-100',
    borderColor: 'border-purple-600',
    winningCellStyle: 'bg-gradient-to-br from-blue-400 to-purple-500 shadow-lg shadow-blue-400/50'
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<GameTheme>('default');

  useEffect(() => {
    const savedTheme = localStorage.getItem('game-theme') as GameTheme;
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  const setTheme = (theme: GameTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem('game-theme', theme);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}