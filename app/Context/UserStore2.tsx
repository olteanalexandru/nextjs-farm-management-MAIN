"use client";
import { createContext, useContext, useState, useEffect } from 'react';
// import { useAuth0 } from '@auth0/auth0-react';
import { useUser } from '@auth0/nextjs-auth0/client';
import axios from 'axios';
import localForage from 'localforage';
import { useRouter } from 'next/router'

const API_URL = 'http://localhost:5000/api/users/';

type DataType = {
  _id: string;
  rol: string;
  name: string;
  email: string;
  password: string;
  token: string;
  fermierUsers?: any[];
};

interface ContextProps {
  data: DataType;
  setData: (data: DataType) => void;
  error: string;
  loading: boolean;
  register: () => void;
  login: () => void;
  logout: () => void;
  modify: (id: string, password: string) => Promise<void>;
  deleteUser: (token:string,id: string) => Promise<void>;
  fetchFermierUsers: (token: string) => Promise<void>;
  fermierUsers: any[];
  isUserLoggedIn: () => Promise<boolean>;
}

const GlobalContext = createContext<ContextProps>({} as ContextProps);

export const GlobalContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<DataType>({ 
   rol: 'Fermier', name: '', email: '', fermierUsers: []
   });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [fermierUsers, setFermierUsers] = useState<any[]>([]);
  const { loginWithRedirect, logout: authLogout, isAuthenticated, user } = useAuth0();
  // const { user, isLoading } = useUser();
  const router = useRouter()



  useEffect(() => {
    const loadUserData = async () => {
      if (user?.name) {
        const storedUser = await localForage.getItem<DataType>('user');
        if (storedUser) {
          setData(storedUser);
        }
      }
    };

    loadUserData();
  }, [ user?.name]);

  const handleRequest = async (userData) => {
    setLoading(true);
    try {

      await localForage.setItem('user', userData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  

  const register = () => {


    router.push("/api/auth/login")
// handleRequest(user)
  };

  const login = () => {

  router.push("/api/auth/login")
// handleRequest(user)


    
  };

  const logout = async () => {

    router.push("/api/auth/logout")
    await localForage.removeItem('user');
  };

  const modify = (id: string, password: string) => {
    // return handleRequest(axios.put(API_URL, { _id: id, password }));
  };

  const deleteUser = async (token:string , id: string) => {
    setLoading(true);
    try {
      await axios.delete(API_URL + id, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((response) => {
        setData(response.data);
      });
    } catch (error) {
      setError('Error deleting user');
    } finally {
      setLoading(false);
    }
  };

  const fetchFermierUsers = async (token: string) => {
    setLoading(true);
    try {
      await axios.get(API_URL + 'fermier', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((response) => {
        setFermierUsers(response.data);
      });
    } catch (error) {
      setError('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const isUserLoggedIn = async (): Promise<boolean> => {
    return user?.name ? true : false;
  };

  return (
    <GlobalContext.Provider
      value={{
        data,
        setData,
        error,
        loading,
        register,
        login,
        logout,
        modify,
        deleteUser,
        fetchFermierUsers,
        fermierUsers,
        isUserLoggedIn,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  return useContext(GlobalContext);
};
