"use client";
import React, { createContext, useContext, useState, type ReactNode } from 'react';
import axios from 'axios';
import { useUser } from '@auth0/nextjs-auth0/client';

// Use environment-based API URL
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/Controllers';
const API_URL = `${BASE_URL}/Post`;

interface Post {
  id: string;
  _id: string;
  title: string;
  brief: string;
  description: string;
  image: string;
  user: string;
}

interface PostContextState {
  data: Post[];
  error: string | null;
  loading: boolean;
}

interface PostContextType extends PostContextState {
  setData: (data: Post[] | ((prevData: Post[]) => Post[])) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  createPost: (data: Omit<Post, 'id' | '_id' | 'user'>) => Promise<void>;
  updatePost: (id: string, data: Partial<Post>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  getPost: (id: string) => Promise<void>;
  getAllPosts: (count?: number) => Promise<void>;
  clearData: () => void;
}

const initialState: PostContextState = {
  data: [],
  error: null,
  loading: false,
};

const PostContext = createContext<PostContextType | null>(null);

interface ProviderProps {
  children: ReactNode;
}

export const GlobalContextProvider = ({ children }: ProviderProps) => {
  const [state, setState] = useState<PostContextState>(initialState);
  const { user } = useUser();

  const setData = (dataOrUpdater: Post[] | ((prevData: Post[]) => Post[])) => {
    setState(prev => ({
      ...prev,
      data: typeof dataOrUpdater === 'function' ? dataOrUpdater(prev.data) : dataOrUpdater
    }));
  };
  
  const setError = (error: string | null) => setState(prev => ({ ...prev, error }));
  const setLoading = (loading: boolean) => setState(prev => ({ ...prev, loading }));

  const axiosConfig = {
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const handleApiError = (error: unknown) => {
    console.error('API Error:', error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      window.location.href = '/api/auth/login';
      return;
    }
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    setError(errorMessage);
    setLoading(false);
  };

  const createPost = async (data: Omit<Post, 'id' | '_id' | 'user'>) => {
    if (!user?.sub) {
      window.location.href = '/api/auth/login';
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post<Post>(
        `${API_URL}/post/new/${user.sub}`,
        data,
        axiosConfig
      );

      if ('error' in response.data) {
        setError((response.data as any).error);
      } else {
        setData(prevData => [...prevData, response.data]);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const updatePost = async (postId: string, data: Partial<Post>) => {
    if (!user?.sub) {
      window.location.href = '/api/auth/login';
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put<Post[]>(
        `${API_URL}/post/${postId}/${user.sub}`,
        data,
        axiosConfig
      );

      if ('error' in response.data) {
        setError((response.data as any).error);
      } else {
        setData(response.data);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string) => {
    if (!user?.sub) {
      window.location.href = '/api/auth/login';
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete<Post[]>(
        `${API_URL}/post/${postId}/${user.sub}`,
        axiosConfig
      );

      if ('error' in response.data) {
        setError((response.data as any).error);
      } else {
        setData(response.data);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const getPost = async (id: string) => {
    setLoading(true);
    try {
      const response = await axios.get<Post>(
        `${API_URL}/post/id/${id}`,
        axiosConfig
      );

      if ('error' in response.data) {
        setError((response.data as any).error);
      } else {
        setData([response.data]);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const getAllPosts = async (count?: number) => {
    setLoading(true);
    try {
      const url = count ? `${API_URL}/posts/count/${count}` : `${API_URL}/posts/retrieve/all`;
      const response = await axios.get<{ posts?: Post[]; error?: string; message?: string }>(
        url,
        axiosConfig
      );
      const responseData = response.data;

      if (responseData.error) {
        setError(responseData.error);
      } else if (responseData.message === "No more posts") {
        setError(responseData.message);
      } else {
        const posts = responseData.posts || [];
        setData(prevData => [...prevData, ...posts]);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const clearData = () => {
    setState(initialState);
  };

  const contextValue: PostContextType = {
    ...state,
    setData,
    setError,
    setLoading,
    createPost,
    updatePost,
    deletePost,
    getPost,
    getAllPosts,
    clearData,
  };

  return (
    <PostContext.Provider value={contextValue}>
      {children}
    </PostContext.Provider>
  );
};

export const useGlobalContextPost = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('useGlobalContextPost must be used within a GlobalContextProvider');
  }
  return context;
};
