"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

interface User {
  sub: string;
  email?: string;
  name?: string;
}

interface UserContextType {
  user: User | null;
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

  // Type-safe user object
  const typedUser = user ? {
    sub: user.sub as string,
    email: user.email as string | undefined,
    name: user.name as string | undefined,
  } : null;

  const value = {
    user: typedUser,
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

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return context;
};
