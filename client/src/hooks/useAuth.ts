import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";

export function useAuth() {
  const { data: user, isLoading: queryLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!queryLoading) {
      const elapsed = Date.now() - startTimeRef.current;
      const remainingTime = Math.max(0, 500 - elapsed); // Reduced from 3000ms to 500ms
      
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, remainingTime);
      
      return () => clearTimeout(timer);
    }
  }, [queryLoading]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}