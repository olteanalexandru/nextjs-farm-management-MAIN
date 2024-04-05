"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import localForage from 'localforage';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';

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
  login: () => void;
  logout: () => void;
  // modify: (id: string, password: string) => Promise<void>;
  deleteUser: (token:string,id: string) => Promise<void>;
  fetchFermierUsers: (token: string) => Promise<void>;
  fermierUsers: any[];
  isUserLoggedIn: () => Promise<void>;
  handleRequest : () => void;
}

const GlobalContext = createContext<ContextProps>({} as ContextProps);

export const GlobalContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<DataType>({ _id: '', rol: "", name: '', email: '', password: '', token: '', fermierUsers: [] });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [fermierUsers, setFermierUsers] = useState<any[]>([]);
const {user, error: authError, isLoading } = useUser();




  useEffect(() => {

    const loadUserData = async () => {
      const storedUser = await localForage.getItem<DataType>('user');

      if (storedUser && storedUser.name && !authError && !isLoading && user && user.name !== null ) {
        setData(storedUser);
      }
    };

    loadUserData();
  }, []);
  
  const router = useRouter();

  useEffect(() => {
    const handleRequest = async () => {
      setLoading(true);
      try {
        if (!isLoading) {
          setData({...user, rol: user.userRoles[0]});
          await localForage.setItem('user', user);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    handleRequest();
  }, [isLoading,user]); 
  
  

const login = async () => {
    await localForage.removeItem('user');
    setData(undefined);
    router.push('/api/auth/login');
  }


  const logout = async () => {
    router.push('/api/auth/logout');
    await localForage.removeItem('user');
    setData(undefined);
  };


const deleteUser = async (token:string , id: string) => {
setLoading(true);
try {
  await axios.delete(API_URL + id,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      },
      }
      ).then((response) => {
      setData(response.data);
      }
      );
      }
      catch (error) {
      setError('Error deleting user');
      } finally {
      setLoading(false);
      }
      };


const fetchFermierUsers = async (token: string) => {
setLoading(true);
try {
  await axios.get(API_URL + 'fermier',
  {
    headers: {
      Authorization: `Bearer ${token}`,
      },
      }
      ).then((response) => {
      setFermierUsers(response.data);
      }
      );
      } catch (error) {
      setError('Error fetching users');
      } finally {
      setLoading(false);
      }
      };


const isUserLoggedIn = async (): Promise<void> => {
  const storedUser = await localForage.getItem<DataType>('user');
  if (storedUser) {
    setData(storedUser);
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


}}
>
{children}
</GlobalContext.Provider>
);
};

export const useGlobalContext = () => {
return useContext(GlobalContext);

};