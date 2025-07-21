// Share configuration that automatically detects environment and uses appropriate URLs

interface ShareConfig {
  appUrl: string;
  playStoreUrl?: string;
  appName: string;
  description: string;
}

// Environment detection
const isReplit = () => {
  return window.location.hostname.includes('replit.') || 
         window.location.hostname.includes('.replit.app') ||
         import.meta.env.VITE_REPLIT_DOMAIN;
};

const isProduction = () => {
  return import.meta.env.PROD && !isReplit();
};

// Share configuration
export const shareConfig: ShareConfig = {
  // Dynamic URL based on environment
  appUrl: isProduction() 
    ? import.meta.env.VITE_PRODUCTION_URL || window.location.origin
    : window.location.origin,
    
  // Play Store URL (set this when you publish to Play Store)
  playStoreUrl: import.meta.env.VITE_PLAY_STORE_URL,
  
  appName: "TicTac 3x5 - Strategic Tic-Tac-Toe",
  description: "Experience the next level of tic-tac-toe with strategic 3x5 gameplay!"
};

// Get the appropriate share URL based on platform and environment
export const getShareUrl = (preferPlayStore: boolean = false): string => {
  // If user specifically wants Play Store link and it's available
  if (preferPlayStore && shareConfig.playStoreUrl) {
    return shareConfig.playStoreUrl;
  }
  
  // If we're in production and Play Store URL is available, prefer it
  if (isProduction() && shareConfig.playStoreUrl) {
    return shareConfig.playStoreUrl;
  }
  
  // Otherwise use the web app URL
  return shareConfig.appUrl;
};

// Get share text based on the URL being shared
export const getShareText = (url: string): string => {
  if (url === shareConfig.playStoreUrl) {
    return `🎮 Check out ${shareConfig.appName} on Google Play! ${shareConfig.description}`;
  }
  
  return `🎯 ${shareConfig.description} Play ${shareConfig.appName} now!`;
};

// Environment info for debugging
export const getEnvironmentInfo = () => {
  return {
    isReplit: isReplit(),
    isProduction: isProduction(),
    hostname: window.location.hostname,
    currentUrl: window.location.origin,
    playStoreConfigured: !!shareConfig.playStoreUrl
  };
};