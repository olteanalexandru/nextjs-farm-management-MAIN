"use client";
import React, { createContext, useContext, useState,  type ReactNode, useCallback } from 'react';
import axios from 'axios';
import { useUser } from '@auth0/nextjs-auth0/client';
import { ApiResponse, Post, PostCreate, PostUpdate } from '../types/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/Controllers';
const API_URL = `${BASE_URL}/Post`;

interface PostContextState {
  data: Post[];
  error: string | null;
  loading: boolean;
}

interface PostContextType extends PostContextState {
  setData: (data: Post[] | ((prevData: Post[]) => Post[])) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  createPost: (data: PostCreate) => Promise<void>;
  updatePost: (id: number | string, data: PostUpdate) => Promise<void>;
  deletePost: (id: number | string) => Promise<void>;
  getPost: (id: number | string) => Promise<void>;
  getAllPosts: (count?: number) => Promise<void>;
  clearData: () => void;
  data: Post[]; // Changed from posts to data to match state
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

export function PostProvider({ children }: ProviderProps) {
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
    if (axios.isAxiosError(error)) {
      setError(error.response?.data?.error || error.message);
    } else {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
    setLoading(false);
  };

  const createPost = async (data: PostCreate) => {
    if (!user?.sub) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post<ApiResponse<Post>>(
        `${API_URL}/posts/create/new`,
        data,
        axiosConfig
      );

      if (response.data.error) {
        setError(response.data.error);
      } else if (response.data.data) {
        setData(prevData => [...prevData, response.data.data!]);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const updatePost = async (postId: number | string, data: PostUpdate) => {
    if (!user?.sub) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put<ApiResponse<Post>>(
        `${API_URL}/posts/${postId}/update`,
        data,
        axiosConfig
      );

      if (response.data.error) {
        setError(response.data.error);
      } else if (response.data.data) {
        setData(prevData => 
          prevData.map(post => 
            post.id === postId ? { ...post, ...response.data.data } : post
          )
        );
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: number | string) => {
    if (!user?.sub) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete<ApiResponse<void>>(
        `${API_URL}/posts/${postId}/delete`,
        axiosConfig
      );

      if (response.data.error) {
        setError(response.data.error);
      } else {
        setData(prevData => prevData.filter(post => post.id !== postId));
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const getPost = async (id: number | string) => {
    setLoading(true);
    try {
      const response = await axios.get<ApiResponse<Post>>(
        `${API_URL}/post/id/${id}`,
        axiosConfig
      );

      if (response.data.error) {
        setError(response.data.error);
      } else if (response.data.posts) {
        const post = Array.isArray(response.data.posts) 
          ? response.data.posts[0] 
          : response.data.posts;
        setData([post]);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const getAllPosts = useCallback(async (count?: number) => {
    setLoading(true);
    try {
      const url = count !== undefined 
        ? `${API_URL}/posts/count/${count}`
        : `${API_URL}/posts/retrieve/all`;
      
      const response = await axios.get<ApiResponse<Post>>(url, axiosConfig);

      if (response.data.error) {
        setError(response.data.error);
      } else if (response.data.message === "No more posts") {
        setError(response.data.message);
      } else if (response.data.posts) {
        setData(response.data.posts);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, []);

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
    clearData
  };

  return (
    <PostContext.Provider value={contextValue}>
      {children}
    </PostContext.Provider>
  );
}

export const usePostContext = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePostContext must be used within a PostProvider');
  }
  return context;
};
