import { auth } from './firebase';

// Enhanced API request function with Firebase authentication
export async function apiRequest(url: string, options: RequestInit = {}) {
  const user = auth.currentUser;
  let headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Add Firebase ID token if user is authenticated
  if (user) {
    try {
      const token = await user.getIdToken();
      headers = {
        ...headers,
        'Authorization': `Bearer ${token}`
      };
    } catch (error) {
      console.error('Error getting ID token:', error);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}