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
      // Reduce minimum loading time to 1 second to prevent app from getting stuck
      const remainingTime = Math.max(0, 1000 - elapsed);
      
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