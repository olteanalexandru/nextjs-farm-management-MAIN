"use client";

import { useState, useEffect, useCallback } from 'react';
import { FaUser, FaSeedling, FaNewspaper, FaCog } from 'react-icons/fa';
import { usePostContext } from '../providers/postStore';
import { useUserContext } from '../providers/UserStore';
import { useGlobalContextCrop } from '../providers/culturaStore';
import PostForm from '../Crud/PostForm';
import RecommendationForm from '../Crud/RecommendationForm';
import RecommendationList from '../Crud/RecommendationList';
import PostList from '../Crud/PostList';

interface FermierUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  roleType: string;
  picture?: string;
}

interface Crop {
  id: number;
  cropName: string;
  cropType: string;
  // Add other crop properties as needed
}

interface Post {
  id: string | number;
  title: string;
  brief: string | null;
  image?: string | null;
}

type Tab = 'users' | 'recommendations' | 'posts' | 'settings';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<FermierUser[]>([]);
  const [loading, setLoading] = useState(false);
  const { 
    crops = [], 
    isLoading: cropsLoading, 
    getCropRecommendations 
  } = useGlobalContextCrop();
  const { data: posts, loading: postsLoading, getAllPosts } = usePostContext();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/Controllers/User');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Only fetch data when the tab changes
  useEffect(() => {
    let mounted = true;

    const loadTabData = async () => {
      if (!mounted) return;

      try {
        switch (activeTab) {
          case 'users':
            await fetchUsers();
            break;
          case 'posts':
            await getAllPosts();
            break;
          case 'recommendations':
            console.log('Loading recommendations...');
            await getCropRecommendations();
            console.log('Recommendations loaded');
            break;
        }
      } catch (error) {
        console.error(`Error loading ${activeTab} data:`, error);
      }
    };

    loadTabData();

    return () => {
      mounted = false;
    };
  }, [activeTab, fetchUsers, getAllPosts, getCropRecommendations]);

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await fetch(`/api/Controllers/User/${userId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">User Management</h3>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <li key={user.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {user.picture && (
                            <img 
                              src={user.picture} 
                              alt={user.name}
                              className="h-10 w-10 rounded-full mr-3"
                            />
                          )}
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            user.roleType === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {user.roleType}
                          </span>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'recommendations':
        return (
          <div className="space-y-6">
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">New Recommendation</h3>
              <RecommendationForm onSuccess={getCropRecommendations} />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">
                Existing Recommendations
                {cropsLoading.value && <span className="ml-2">(Loading...)</span>}
              </h3>
              {cropsLoading.value ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : crops.length === 0 ? (
                <p className="text-gray-500">No recommendations found</p>
              ) : (
                <RecommendationList 
                  recommendations={crops}
                  onDelete={async (id: number) => {
                    await getCropRecommendations();
                  }}
                />
              )}
            </div>
          </div>
        );

      case 'posts':
        return (
          <div className="space-y-6">
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Create New Post</h3>
              <PostForm onSuccess={getAllPosts} />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">All Posts</h3>
              {postsLoading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <PostList 
                  posts={posts || []}
                  onDelete={getAllPosts}
                />
              )}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">System Settings</h3>
            <div className="bg-white shadow sm:rounded-lg p-6">
              <p>System settings and configuration options will be available here.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'users', label: 'Users', icon: FaUser },
            { id: 'recommendations', label: 'Recommendations', icon: FaSeedling },
            { id: 'posts', label: 'Posts', icon: FaNewspaper },
            { id: 'settings', label: 'Settings', icon: FaCog },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as Tab)}
              className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <Icon className="mr-2 h-5 w-5" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
}
