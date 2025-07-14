// Simple auth API calls
export const login = async (credentials: { username: string; password: string }) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  return response.json();
};

export const register = async (credentials: { username: string; password: string }) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  if (!response.ok) {
    throw new Error('Registration failed');
  }
  
  return response.json();
};

export const logout = async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
};

export const getCurrentUser = async () => {
  const response = await fetch('/api/auth/user');
  if (!response.ok) {
    return null;
  }
  return response.json();
};