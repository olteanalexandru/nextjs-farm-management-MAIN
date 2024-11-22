"use client";

import { useState, useEffect } from 'react';
import { FaUser } from 'react-icons/fa';
import { usePostContext } from '../providers/postStore';
import { useUserContext } from '../providers/UserStore';
import { useGlobalContextCrop } from '../providers/culturaStore';
import { Post } from '../types/api';
import PostForm from '../Crud/PostForm';
import RecommendationForm from '../Crud/RecommendationForm';
import RecommendationList from '../Crud/RecommendationList';
import Pagination from './Pagination';

interface FermierUser {
  _id: string;
  name: string;
  email: string;
}

const UserListItem = ({ user, deleteUser }: { user: FermierUser; deleteUser: (id: string) => void }) => (
  <li key={user._id} className="flex justify-between items-center p-3 bg-white rounded shadow mb-2">
    <span>{user.name} - {user.email}</span>
    <button 
      onClick={() => deleteUser(user._id)}
      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
    >
      Delete
    </button>
  </li>
);

export default function AdminDashboard() {
  const { data: posts, getAllPosts, deletePost } = usePostContext();
  const { fetchFermierUsers, deleteUser, fermierUsers } = useUserContext();
  const { crops, getCrops } = useGlobalContextCrop();
  
  const [selectedPost, setSelectedPost] = useState<Post | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [showRecommendationForm, setShowRecommendationForm] = useState(false);
  const [postSearchTerm, setPostSearchTerm] = useState('');
  const [recommendationSearchTerm, setRecommendationSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [recommendationsPage, setRecommendationsPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    Promise.all([
      getAllPosts(),
      fetchFermierUsers()
    ]);
  }, []);

  // Reset page when search terms change
  useEffect(() => {
    setCurrentPage(1);
  }, [postSearchTerm]);

  useEffect(() => {
    setRecommendationsPage(1);
  }, [recommendationSearchTerm]);

  // Filter and paginate posts
  const filteredPosts = posts?.filter(post =>
    post.title.toLowerCase().includes(postSearchTerm.toLowerCase()) ||
    post.brief?.toLowerCase().includes(postSearchTerm.toLowerCase())
  ) || [];

  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Filter and paginate recommendations
  const recommendations = crops.value.filter(crop => crop.cropType === 'RECOMMENDATION');
  const filteredRecommendations = recommendations.filter(rec =>
    rec.cropName.toLowerCase().includes(recommendationSearchTerm.toLowerCase())
  );

  const paginatedRecommendations = filteredRecommendations.slice(
    (recommendationsPage - 1) * itemsPerPage,
    recommendationsPage * itemsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Post Management Section */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Post Management</h3>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Create New Post
              </button>
            )}
          </div>

          {showForm && (
            <div className="mb-8">
              <PostForm 
                post={selectedPost}
                onSuccess={() => {
                  setShowForm(false);
                  setSelectedPost(undefined);
                  getAllPosts();
                }}
                onCancel={() => {
                  setShowForm(false);
                  setSelectedPost(undefined);
                }}
              />
            </div>
          )}

          <div className="mt-6">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search posts..."
                value={postSearchTerm}
                onChange={(e) => setPostSearchTerm(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginatedPosts.map(post => (
                <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                  <div className="p-4">
                    <h5 className="text-lg font-semibold mb-2">{post.title}</h5>
                    {post.image && (
                      <img 
                        src={post.image} 
                        alt={post.title}
                        className="w-full h-48 object-cover rounded-md mb-4"
                      />
                    )}
                    <p className="text-gray-600 mb-4 line-clamp-3">{post.brief}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setSelectedPost(post);
                          setShowForm(true);
                        }}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 text-sm"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Are you sure?')) {
                            deletePost(post.id);
                          }
                        }}
                        className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-200 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredPosts.length / itemsPerPage)}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      {/* Crop Recommendations Section */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Crop Recommendations</h3>
            {!showRecommendationForm && (
              <button
                onClick={() => setShowRecommendationForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
              >
                Add New Recommendation
              </button>
            )}
          </div>

          {showRecommendationForm && (
            <div className="mb-8">
              <RecommendationForm
                onSuccess={() => {
                  setShowRecommendationForm(false);
                  getCrops();
                }}
                onCancel={() => setShowRecommendationForm(false)}
              />
            </div>
          )}

          <div className="mt-6">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search recommendations..."
                value={recommendationSearchTerm}
                onChange={(e) => setRecommendationSearchTerm(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <RecommendationList recommendations={paginatedRecommendations} />

            <Pagination
              currentPage={recommendationsPage}
              totalPages={Math.ceil(filteredRecommendations.length / itemsPerPage)}
              onPageChange={setRecommendationsPage}
            />
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            User Management
          </h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <a href="/create-post" 
                 className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200">
                Add Post
              </a>
              <a href="/register" 
                 className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200">
                <FaUser className="inline mr-2" /> Add users
              </a>
            </div>
            
            <div className="mt-6">
              <h4 className="text-xl font-semibold mb-4">Farmers:</h4>
              <ul className="space-y-2">
                {fermierUsers?.map((user: FermierUser) => (
                  <UserListItem
                    key={user._id}
                    user={user}
                    deleteUser={deleteUser}
                  />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
