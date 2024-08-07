"use client";
import { createContext, useContext, Dispatch , SetStateAction , useState } from 'react';
import axios from 'axios'
import { useUser } from '@auth0/nextjs-auth0/client';

//const API_URL = 'http://localhost:3000/api/Controllers/Post'
const API_URL = 'https://fictional-space-giggle-pwpr6qw7w5427v6q-3000.app.github.dev/api/Controllers/Post'
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
    createPost: ( data: DataType , token:string   ) => Promise<void>;
    updatePost: (id: string , title: string, brief: string, description: string, image: string) => Promise<void>;
    deletePost: (_id: string, token:string) => Promise<void>;
    getPost: (id: string) => Promise<void>;
    getAllPosts: (count : number) => Promise<void>;
    clearData: () => void;
   
}

const ContextProps  = createContext<ContextProps>({
    data: [],
    setData: () => {},
    error: '',
    setError: () => {},
    loading: false,
    setLoading: () => {},
    createPost: () => Promise.resolve(),
    modify: () => Promise.resolve(),
    deletePost: () => Promise.resolve(),
    getPost: () => Promise.resolve(),
    getAllPosts: () => Promise.resolve(),
    clearData: () => {},
});
interface Props {
    children: React.ReactNode;
    }

const GlobalContext = createContext<ContextProps>({} as ContextProps);
export const GlobalContextProvider: React.FC<Props> = ({ children }) => {

    const [data, setData] = useState<any[]>([]);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const { user, error: authError, isLoading: isUserLoading  } = useUser();


    const createPost = async ({ title, brief, description, image }: any) => {
        setLoading(true);
        try {
          const response = await axios.post(API_URL + "/post" + "/new/" + user.sub, {
            title,
            brief,
            description,
            image,
          }, {
      
          });
          const data = await response.data;
          if (data.error) {
            setError(data.error);
            setLoading(false);
            console.log(data.error)
          } else {
            setData((prevData) => [...prevData, data]);
            setLoading(false);
    
          }
        } catch (error: any) {
          setError(error.response.data.message);
          setLoading(false);
        }
      }


    const updatePost = async (postId: string, { title, brief, description, image }: any) => {
        setLoading(true);
        try {
            const response = await axios.put(API_URL + "/post/" + postId + "/" + user.sub , {
                title,
                brief,
                description,
                image,
            }, {
            });
            const data = await response.data;
            if (data.error) {
                setError(data.error);
                setLoading(false);
            } else {
                setData(data);
                setLoading(false);
            }
        } catch (error:any ) {
            setError(error.response.data.message);
            setLoading(false);
        }
    }
 


    const deletePost = async (postId: string) => {
        setLoading(true);
        try {

            const response = await axios.delete(API_URL + "/post/" + postId + "/" + user.sub); {
            }
            const data = await response.data;
            if (data.error) {
                setError(data.error);
                setLoading(false);
            } else {
                setData(data);
                setLoading(false);
            }
        } catch (error:any ) {
            setError(error.response.data.message);
            setLoading(false);
        }
    }




    const getPost = async (id: string) => {
        //solved
        setLoading(true);
        try {
            const response = await axios.get(API_URL + "/post/id/" + id);
            const data = await response.data;
            if (data.error) {
                setError(data.error);
                setLoading(false);
            } else {
                setData(data);
                setLoading(false);
               
            }
        } catch (error:any ) {
            setError(error.response.data.message);
            setLoading(false);
        }
    }

    
   
    const getAllPosts = async (count: number) => {
        //solved
        setLoading(true);
        try {
            const url = count ? API_URL + "/posts/count/" + count : API_URL + "/posts/retrieve/all";
            const response = await axios.get(url);
            const data = await response.data;
            console.log("it did trigger")
            if (data.error) {
                setError(data.error);
                setLoading(false);
            } else if (data.message === "No more posts") {
                setError(data.message);
                setLoading(false);
            } else {
                setData((prevData: any) => {
                    if (Array.isArray(prevData)) {
                        return [...prevData, ...data.posts];
                    } else {
                        return [...data.posts];
                    }
                });
                setLoading(false);
            }
            
        } catch (error: any) {
            setError(error.response.data.message);
            setLoading(false);
        }
    }


    const clearData = () => {
        setData([]);
        setError('');
    }

    
    



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

export const useGlobalContextPost = () =>{
    return useContext(GlobalContext);
} 


