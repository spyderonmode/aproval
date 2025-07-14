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

export const register = async (credentials: { username: string; password: string; email?: string }) => {
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

export const sendEmailVerification = async (email: string) => {
  const response = await fetch('/api/auth/send-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  if (!response.ok) {
    throw new Error('Failed to send verification email');
  }
  
  return response.json();
};

export const verifyEmail = async (token: string) => {
  const response = await fetch('/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  
  if (!response.ok) {
    throw new Error('Email verification failed');
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