"use client";

import { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

interface AdminContextType {
  users: any[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUserRole: (email: string, roleType: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/Controllers/User/all');
      setUsers(response.data.users || []);
    } catch (error) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const response = await axios.delete(`/api/Controllers/User/${userId}`);
      if (response.status === 200) {
        setUsers(prev => prev.filter(user => user.id !== userId));
      }
    } catch (error) {
      setError('Failed to delete user');
      console.error('Error deleting user:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserRole = useCallback(async (email: string, roleType: string) => {
    try {
      setLoading(true);
      const response = await axios.put('/api/Controllers/User/role', {
        email,
        roleType
      });
      if (response.status === 200) {
        await fetchUsers();
      }
    } catch (error) {
      setError('Failed to update user role');
      console.error('Error updating user role:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  return (
    <AdminContext.Provider value={{
      users,
      loading,
      error,
      fetchUsers,
      deleteUser,
      updateUserRole
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdminStore = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminStore must be used within an AdminProvider');
  }
  return context;
};
