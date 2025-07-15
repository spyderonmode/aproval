export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export const DEFAULT_THEME: ThemeColors = {
  primary: "#3b82f6",
  secondary: "#1e40af",
  accent: "#60a5fa",
  background: "#1e293b",
  text: "#f1f5f9"
};

export function parseUserTheme(themeString?: string): ThemeColors {
  if (!themeString) return DEFAULT_THEME;
  
  try {
    const parsed = JSON.parse(themeString);
    return {
      primary: parsed.primary || DEFAULT_THEME.primary,
      secondary: parsed.secondary || DEFAULT_THEME.secondary,
      accent: parsed.accent || DEFAULT_THEME.accent,
      background: parsed.background || DEFAULT_THEME.background,
      text: parsed.text || DEFAULT_THEME.text,
    };
  } catch {
    return DEFAULT_THEME;
  }
}

export function applyUserTheme(user: any, element?: HTMLElement): ThemeColors {
  const theme = parseUserTheme(user?.profileTheme);
  
  if (element) {
    element.style.setProperty('--user-primary', theme.primary);
    element.style.setProperty('--user-secondary', theme.secondary);
    element.style.setProperty('--user-accent', theme.accent);
    element.style.setProperty('--user-background', theme.background);
    element.style.setProperty('--user-text', theme.text);
  }
  
  return theme;
}

export function getThemeStyles(theme: ThemeColors) {
  return {
    '--user-primary': theme.primary,
    '--user-secondary': theme.secondary,
    '--user-accent': theme.accent,
    '--user-background': theme.background,
    '--user-text': theme.text,
  } as React.CSSProperties;
}