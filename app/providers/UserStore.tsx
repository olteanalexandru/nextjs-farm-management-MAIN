"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import axios from 'axios';

// Types
interface UserData {
  name: string | null;
  email: string | null;
  role: string;
  _id?: string;
}

interface UserContextType {
  data: UserData;
  isUserLoggedIn: boolean;
  isLoading: boolean;
  updateRole: (email: string, roleType: string) => Promise<void>;
  fetchFermierUsers: () => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  fermierUsers: any[];
  login: () => void;
  logout: () => void;
}

const API_URL = '/api/Controllers/User/';

const initialUserData: UserData = {
  name: null,
  email: null,
  role: '',
  _id: '',
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useUser();
  const [data, setData] = useState<UserData>(initialUserData);
  const [fermierUsers, setFermierUsers] = useState<any[]>([]);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const syncUser = async () => {
      if (authLoading) {
        return;
      }

      if (user) {
        try {
          // Create/update user in our database
          const response = await axios.post(API_URL);
          const userData = response.data.user;
          
          setData({
            name: user.name,
            email: user.email,
            role: userData.roleType,
            _id: userData.id
          });
          setIsUserLoggedIn(true);
        } catch (error) {
          console.error('Error syncing user:', error);
          // On error, redirect to login
          window.location.href = '/api/auth/login';
          return;
        }
      } else if (!authLoading) {
        // Only reset if we're not loading and there's no user
        setData(initialUserData);
        setIsUserLoggedIn(false);
      }
      setIsLoading(false);
    };

    syncUser();
  }, [user, authLoading]);

  const updateRole = async (email: string, roleType: string) => {
    try {
      const response = await axios.put(API_URL, { email, roleType });
      if (response.status === 200) {
        if (email === data.email) {
          setData(prev => ({ ...prev, role: roleType }));
        }
        await fetchFermierUsers();
      }
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  };

  const fetchFermierUsers = async () => {
    try {
      const response = await axios.get(API_URL);
      if (response.status === 200) {
        const farmers = response.data.users.filter(user => user.roleType === 'FARMER');
        setFermierUsers(farmers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const response = await axios.delete(`${API_URL}/${userId}`);
      if (response.status === 200) {
        setFermierUsers(prev => prev.filter(user => user.id !== userId));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const value = {
    data,
    isUserLoggedIn,
    isLoading: authLoading || isLoading,
    updateRole,
    fetchFermierUsers,
    deleteUser,
    fermierUsers,
    login: () => window.location.href = '/api/auth/login',
    logout: () => window.location.href = '/api/auth/logout'
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
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};
