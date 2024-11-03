"use client";
import { createContext, useContext, Dispatch, SetStateAction, useState } from 'react';
import axios from 'axios';
import { useUser } from '@auth0/nextjs-auth0/client';

const API_URL = '/api/Controllers/Post'; // Use relative URL to avoid CORS issues

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
    setData: Dispatch<SetStateAction<any>>;
    error: string;
    setError: Dispatch<SetStateAction<string>>;
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    createPost: (data: DataType, token: string) => Promise<void>;
    updatePost: (id: string, title: string, brief: string, description: string, image: string) => Promise<void>;
    deletePost: (_id: string, token: string) => Promise<void>;
    getPost: (id: string) => Promise<void>;
    getAllPosts: (count: number) => Promise<void>;
    clearData: () => void;
}

const GlobalContext = createContext<ContextProps>({} as ContextProps);

export const GlobalContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [data, setData] = useState<any[]>([]);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const { user, error: authError, isLoading: isUserLoading } = useUser();

    const axiosConfig = {
        withCredentials: true, // Include cookies in requests
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const handleError = (error: any) => {
        if (error.response?.status === 401) {
            window.location.href = '/api/auth/login';
            return;
        }
        setError(error.response?.data?.message || 'An error occurred');
        setLoading(false);
    };

    const createPost = async ({ title, brief, description, image }: any) => {
        if (!user) {
            window.location.href = '/api/auth/login';
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/post/new/${user.sub}`, {
                title,
                brief,
                description,
                image,
            }, axiosConfig);

            if (response.data.error) {
                setError(response.data.error);
            } else {
                setData((prevData) => [...prevData, response.data]);
            }
        } catch (error: any) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const updatePost = async (postId: string, { title, brief, description, image }: any) => {
        if (!user) {
            window.location.href = '/api/auth/login';
            return;
        }

        setLoading(true);
        try {
            const response = await axios.put(`${API_URL}/post/${postId}/${user.sub}`, {
                title,
                brief,
                description,
                image,
            }, axiosConfig);

            if (response.data.error) {
                setError(response.data.error);
            } else {
                setData(response.data);
            }
        } catch (error: any) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const deletePost = async (postId: string) => {
        if (!user) {
            window.location.href = '/api/auth/login';
            return;
        }

        setLoading(true);
        try {
            const response = await axios.delete(`${API_URL}/post/${postId}/${user.sub}`, axiosConfig);

            if (response.data.error) {
                setError(response.data.error);
            } else {
                setData(response.data);
            }
        } catch (error: any) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const getPost = async (id: string) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/post/id/${id}`, axiosConfig);

            if (response.data.error) {
                setError(response.data.error);
            } else {
                setData(response.data);
            }
        } catch (error: any) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const getAllPosts = async (count: number) => {
        setLoading(true);
        try {
            const url = count ? `${API_URL}/posts/count/${count}` : `${API_URL}/posts/retrieve/all`;
            const response = await axios.get(url, axiosConfig);
            const responseData = response.data;

            if (responseData.error) {
                setError(responseData.error);
            } else if (responseData.message === "No more posts") {
                setError(responseData.message);
            } else {
                const posts = responseData.posts || [];
                setData((prevData: any) => {
                    if (Array.isArray(prevData)) {
                        return [...prevData, ...posts];
                    }
                    return posts;
                });
            }
        } catch (error: any) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const clearData = () => {
        setData([]);
        setError('');
    };

    return (
        <GlobalContext.Provider
            value={{
                data,
                setData,
                error,
                setError,
                loading,
                setLoading,
                getPost,
                getAllPosts,
                createPost,
                updatePost,
                deletePost,
                clearData
            }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobalContextPost = () => {
    return useContext(GlobalContext);
};
