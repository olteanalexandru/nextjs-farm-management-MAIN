
import axios from 'axios';
import { API_ROUTES } from '../config';

export const apiClient = axios.create({
  baseURL: API_ROUTES.base,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth headers or other modifications here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const api = {
  crop: {
    getAll: () => apiClient.get(API_ROUTES.controllers.crop + '/crops/retrieve/all'),
    getById: (id: string) => apiClient.get(`${API_ROUTES.controllers.crop}/crop/id/${id}`),
    create: (data: any) => apiClient.post(`${API_ROUTES.controllers.crop}/crop/single`, data),
    update: (id: string, data: any) => apiClient.put(`${API_ROUTES.controllers.crop}/crop/${id}`, data),
    delete: (id: string) => apiClient.delete(`${API_ROUTES.controllers.crop}/crops/${id}`),
  },
  post: {
    getAll: (count?: number) => apiClient.get(`${API_ROUTES.controllers.post}/posts/count/${count || ''}`),
    getById: (id: string) => apiClient.get(`${API_ROUTES.controllers.post}/post/id/${id}`),
    create: (data: any) => apiClient.post(`${API_ROUTES.controllers.post}/post/new`, data),
    update: (id: string, data: any) => apiClient.put(`${API_ROUTES.controllers.post}/post/${id}`, data),
    delete: (id: string) => apiClient.delete(`${API_ROUTES.controllers.post}/post/${id}`),
  },
  rotation: {
    getAll: () => apiClient.get(`${API_ROUTES.controllers.rotation}/getRotation/rotation`),
    generate: (data: any) => apiClient.post(`${API_ROUTES.controllers.rotation}/generateRotation/rotation`, data),
    update: (data: any) => apiClient.put(`${API_ROUTES.controllers.rotation}/updateRotation/rotation`, data),
    delete: (id: string) => apiClient.delete(`${API_ROUTES.controllers.rotation}/deleteRotation/${id}`),
  },
  user: {
    getFarmers: () => apiClient.get(`${API_ROUTES.controllers.user}/fermieri`),
    register: (data: any) => apiClient.post(`${API_ROUTES.controllers.user}/register`, data),
    updateRole: (data: any) => apiClient.post(`${API_ROUTES.controllers.user}/changeRole`, data),
    delete: (id: string) => apiClient.delete(`${API_ROUTES.controllers.user}/delete/${id}`),
  },
};