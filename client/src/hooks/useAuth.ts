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
    // Always show loading for at least 2.5 seconds, then stop regardless of query state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}