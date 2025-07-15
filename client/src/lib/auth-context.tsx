import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

interface AuthUser {
  id: string;
  email?: string;
  username: string;
  displayName?: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  wins?: number;
  losses?: number;
  draws?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  firebaseUser: User | null;
  idToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get the ID token
          const token = await firebaseUser.getIdToken();
          setIdToken(token);
          setFirebaseUser(firebaseUser);
          
          // Get user data from our API
          const response = await fetch('/api/auth/user', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Create user data from Firebase user
            const userData: AuthUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email || undefined,
              username: firebaseUser.email?.split('@')[0] || firebaseUser.displayName || firebaseUser.uid,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
              profilePicture: firebaseUser.photoURL || undefined,
              isEmailVerified: firebaseUser.emailVerified,
              wins: 0,
              losses: 0,
              draws: 0
            };
            setUser(userData);
          }
        } catch (error) {
          console.error('Error getting user data:', error);
          setUser(null);
          setIdToken(null);
        }
      } else {
        setUser(null);
        setFirebaseUser(null);
        setIdToken(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      firebaseUser,
      idToken
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}