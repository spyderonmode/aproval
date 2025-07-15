import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          
          const userProfile = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            username: userData?.username || firebaseUser.email?.split('@')[0],
            displayName: userData?.displayName || firebaseUser.displayName,
            profilePicture: userData?.profilePicture || firebaseUser.photoURL,
            isEmailVerified: firebaseUser.emailVerified,
            wins: userData?.wins || 0,
            losses: userData?.losses || 0,
            draws: userData?.draws || 0
          };
          
          setUser(userProfile);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}