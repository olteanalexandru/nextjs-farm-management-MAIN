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
  token?: string;
}

interface UserContextType {
  data: UserData;
  isUserLoggedIn: boolean;
  updateRole: (email: string, roleType: string) => Promise<void>;
  fetchFermierUsers: () => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  fermierUsers: any[];
}

const API_URL = '/api/Controllers/User/';

const initialUserData: UserData = {
  name: null,
  email: null,
  role: '',
  _id: '',
  token: ''
};

const UserContext = createContext<UserContextType | null>(null);

export function GlobalContextProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const [data, setData] = useState<UserData>(initialUserData);
  const [fermierUsers, setFermierUsers] = useState<any[]>([]);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  // Sync Auth0 user data with our format
  useEffect(() => {
    if (user && !isLoading) {
      // Make API call to get or create user in our database
      axios.post(API_URL, {
        auth0Id: user.sub,
        name: user.name,
        email: user.email
      }).then(response => {
        setData({
          name: user.name || null,
          email: user.email || null,
          role: response.data.user.roleType || 'FARMER',
          _id: response.data.user.id,
          token: response.data.token
        });
        setIsUserLoggedIn(true);
      }).catch(error => {
        console.error('Error syncing user data:', error);
      });
    } else if (!isLoading) {
      setData(initialUserData);
      setIsUserLoggedIn(false);
    }
  }, [user, isLoading]);

  const updateRole = async (email: string, roleType: string) => {
    try {
      const response = await axios.put(API_URL, { email, roleType });
      if (response.status === 200) {
        // Update local state if the current user's role was changed
        if (email === data.email) {
          setData(prev => ({ ...prev, role: roleType }));
        }
        // Refresh farmer users list if needed
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
        // Filter for farmer users if needed
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
        // Remove user from local state
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
    updateRole,
    fetchFermierUsers,
    deleteUser,
    fermierUsers
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export const useGlobalContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useGlobalContext must be used within a GlobalContextProvider');
  }
  return context;
};