"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';

const API_URL = 'http://localhost:3000/api/Controllers/User/';

type DataType = {
  _id: string;
  role: string;
  name: string;
  email: string;
  fermierUsers?: any[];
  picture?: string;
};

interface ContextProps {
  data: DataType;
  setData: (data: DataType) => void;
  error: string;
  loading: boolean;
  login: () => void;
  logout: () => void;
  deleteUser: (id: string) => Promise<void>;
  fetchFermierUsers: () => Promise<void>;
  fermierUsers: any[];
  isUserLoggedIn: () => boolean;
  register: (role: string, name: string, email: string) => Promise<void>;
  updateRole: (email: string, role: string) => Promise<void>;
}

const GlobalContext = createContext<ContextProps>({} as ContextProps);

export const GlobalContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<DataType>({ _id: '', role: "", name: '', email: '', fermierUsers: [] });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [fermierUsers, setFermierUsers] = useState<any[]>([]);
  const { user, error: authError, isLoading } = useUser();
  
  const router = useRouter();

  useEffect(() => {
    if (user && user.name && !authError && !isLoading) {
      // Get user roles from Auth0 namespace
      const userRoles = user[`${process.env.NEXT_PUBLIC_AUTH0_AUDIENCE}/roles`] || [];
      const defaultRole = 'FARMER'; // Default role if none is set

      setData({
        _id: user.sub,
        role: userRoles[0] || defaultRole,
        name: user.name,
        email: user.email,
        fermierUsers: [],
        picture: user.picture
      });
    }
  }, [user, authError, isLoading]);

  // Check if user is logged in
  const isUserLoggedIn = () => {
    if (user) {
      const userRoles = user[`${process.env.NEXT_PUBLIC_AUTH0_AUDIENCE}/roles`] || [];
      setData({
        _id: user.sub,
        role: userRoles[0] || 'FARMER',
        name: user.name,
        email: user.email,
        fermierUsers: [],
        picture: user.picture
      });
      return true;
    }
    return false;
  };
  
  const register = async (role: string, name: string, email: string) => {
    setLoading(true);
    try {
      const response = await axios.post(API_URL + 'register', {
        name,
        email,
        role
      });
      setData(response.data);
      router.push('/');
    } catch (err) {
      setError('Error registering user');
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    setData(undefined);
    router.push('/api/auth/login');
  };

  const logout = () => {
    router.push('/api/auth/logout');
    setData(undefined);
  };

  const deleteUser = async (id: string) => {
    setLoading(true);
    try {
      await axios.delete(API_URL + "delete/" + id);
      setFermierUsers((prevFermierUsers) =>
        prevFermierUsers.filter((user) => user._id !== id)
      );
    } catch (err) {
      setError('Error deleting user');
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (email: string, role: string) => {
    setLoading(true);
    try {
      const response = await axios.post(API_URL + 'changeRole', {
        email,
        role
      });
      setData(response.data);
    } catch (err) {
      setError('Error updating role');
    } finally {
      setLoading(false);
    }
  };

  const fetchFermierUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL + 'fermieri');
      setFermierUsers(response.data);
    } catch (err) {
      setError('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlobalContext.Provider
      value={{
        data,
        login,
        setData,
        logout,
        error,
        loading,
        deleteUser,
        fetchFermierUsers,
        fermierUsers,
        isUserLoggedIn,
        register,
        updateRole
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  return useContext(GlobalContext);
};