"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

interface UserContextType {
  user: any;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  error: null,
  isAuthenticated: false,
});

export function GlobalContextProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading, error } = useUser();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  const value = {
    user,
    isLoading,
    error,
    isAuthenticated,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export const useUserContext = () => useContext(UserContext);
