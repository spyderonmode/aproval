// Utility functions for handling and formatting error messages
import { t } from "@/lib/i18n";

export function parseErrorMessage(error: any): string {
  if (!error) return t('unexpectedError');
  
  // If error is a string, try to parse it
  if (typeof error === 'string') {
    try {
      // Handle cases like "403: {'error':'You are blocked by this user'}"
      const statusMatch = error.match(/^\d+:\s*(.+)$/);
      if (statusMatch) {
        const errorPart = statusMatch[1];
        try {
          const parsed = JSON.parse(errorPart);
          if (parsed.error) {
            return formatUserFriendlyError(parsed.error);
          }
        } catch {
          // If JSON parsing fails, try to extract error from string
          const errorMatch = errorPart.match(/'error':\s*'([^']+)'/);
          if (errorMatch) {
            return formatUserFriendlyError(errorMatch[1]);
          }
        }
        return formatUserFriendlyError(errorPart);
      }
      return formatUserFriendlyError(error);
    } catch {
      return formatUserFriendlyError(error);
    }
  }
  
  // If error is an object
  if (error.message) {
    return parseErrorMessage(error.message);
  }
  
  if (error.error) {
    return formatUserFriendlyError(error.error);
  }
  
  return t('unexpectedError');
}

function formatUserFriendlyError(errorMessage: string): string {
  // Common error message mappings with translations
  const errorMappings: Record<string, () => string> = {
    "You are blocked by this user": () => t('blocked'),
    "Target user connection not found": () => t('userOffline'),
    "User not found": () => t('playerNotFound'),
    "Not authenticated": () => t('notAuthenticated'),
    "Access denied": () => t('accessDenied'),
    "Invalid request": () => t('unexpectedError'),
    "Server error": () => t('serviceUnavailable'),
    "Network error": () => t('networkError'),
    "Unauthorized": () => t('unauthorized'),
    "Forbidden": () => t('accessDenied'),
    "Not found": () => t('playerNotFound'),
    "Conflict": () => t('unexpectedError'),
    "Too many requests": () => t('tooManyRequests'),
    "Service unavailable": () => t('serviceUnavailable')
  };
  
  // Check for exact matches first
  if (errorMappings[errorMessage]) {
    return errorMappings[errorMessage]();
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(errorMappings)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return value();
    }
  }
  
  // Handle common HTTP status codes
  if (errorMessage.includes('400')) {
    return t('unexpectedError');
  }
  if (errorMessage.includes('401') || errorMessage.includes('403')) {
    return t('unauthorized');
  }
  if (errorMessage.includes('404')) {
    return t('playerNotFound');
  }
  if (errorMessage.includes('409')) {
    return t('unexpectedError');
  }
  if (errorMessage.includes('429')) {
    return t('tooManyRequests');
  }
  if (errorMessage.includes('500')) {
    return t('serviceUnavailable');
  }
  if (errorMessage.includes('503')) {
    return t('serviceUnavailable');
  }
  
  // Clean up technical error messages
  const cleanedMessage = errorMessage
    .replace(/^\d+:\s*/, '') // Remove status codes
    .replace(/^Error:\s*/, '') // Remove "Error:" prefix
    .replace(/\{[^}]*\}/g, '') // Remove JSON objects
    .replace(/["']/g, '') // Remove quotes
    .trim();
  
  // If the cleaned message is empty or too technical, provide a generic message
  if (!cleanedMessage || cleanedMessage.length < 5 || containsTechnicalTerms(cleanedMessage)) {
    return t('unexpectedError');
  }
  
  // Capitalize first letter
  return cleanedMessage.charAt(0).toUpperCase() + cleanedMessage.slice(1);
}

function containsTechnicalTerms(message: string): boolean {
  const technicalTerms = [
    'http', 'api', 'json', 'sql', 'database', 'server', 'client',
    'request', 'response', 'status', 'code', 'stack', 'trace',
    'function', 'method', 'object', 'array', 'null', 'undefined'
  ];
  
  const lowerMessage = message.toLowerCase();
  return technicalTerms.some(term => lowerMessage.includes(term));
}

export function showUserFriendlyError(error: any, toast: any) {
  const friendlyMessage = parseErrorMessage(error);
  
  toast({
    title: t('error'),
    description: friendlyMessage,
    variant: "destructive",
  });
}