
'use client';
import { createContext, useContext, useState } from 'react';
import { api } from '../lib/api-helpers';
import { useUser } from '@auth0/nextjs-auth0/client';

type DataType = {
  id: string;
  _id: string;
  title: string;
  brief: string;
  description: string;
  image: string;
  user: string;
  token: string;
}

interface ContextProps {
  data: any;
  setData: (data: any) => void;
  error: string;
  loading: boolean;
  createPost: (data: DataType) => Promise<void>;
  updatePost: (id: string, data: Partial<DataType>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  getPost: (id: string) => Promise<void>;
  getAllPosts: (count?: number) => Promise<void>;
  clearData: () => void;
}

const GlobalContext = createContext<ContextProps>({} as ContextProps);

export const GlobalContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useUser();

  const createPost = async (postData: DataType) => {
    setLoading(true);
    try {
      const response = await api.post.create({
        ...postData,
        userId: user?.sub
      });
      setData((prevData) => [...prevData, response.data]);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error creating post');
    } finally {
      setLoading(false);
    }
  };

  const updatePost = async (id: string, postData: Partial<DataType>) => {
    setLoading(true);
    try {
      const response = await api.post.update(id, postData);
      setData(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error updating post');
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id: string) => {
    setLoading(true);
    try {
      await api.post.delete(id);
      setData((prevData) => prevData.filter(post => post._id !== id));
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error deleting post');
    } finally {
      setLoading(false);
    }
  };

  const getPost = async (id: string) => {
    setLoading(true);
    try {
      const response = await api.post.getById(id);
      setData(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error fetching post');
    } finally {
      setLoading(false);
    }
  };

  const getAllPosts = async (count?: number) => {
    setLoading(true);
    try {
      const response = await api.post.getAll(count);
      if (response.data.message === "No more posts") {
        setError(response.data.message);
      } else {
        setData((prevData) => {
          if (Array.isArray(prevData)) {
            return [...prevData, ...response.data.posts];
          }
          return response.data.posts;
        });
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error fetching posts');
    } finally {
      setLoading(false);
    }
  };

  const clearData = () => {
    setData([]);
    setError('');
  };

  return (
    <GlobalContext.Provider value={{
      data,
      setData,
      error,
      loading,
      createPost,
      updatePost,
      deletePost,
      getPost,
      getAllPosts,
      clearData
    }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContextPost = () => useContext(GlobalContext);