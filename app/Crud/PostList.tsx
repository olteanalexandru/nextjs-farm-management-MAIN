"use client";

import { useState, useMemo } from 'react';
import { usePostContext } from '../providers/postStore';
import PostForm from './PostForm';
import SearchAndFilter from './SearchAndFilter';
import { Post } from '../types/api';

interface PostListProps {
  posts: Post[];
  onDelete?: () => Promise<void>;
}

export default function PostList({ posts, onDelete }: PostListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { deletePost, updatePost } = usePostContext();

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    return posts.filter(post => 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.brief?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [posts, searchQuery]);

  const handleDelete = async (post: Post) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await deletePost(post.id);
      if (onDelete) {
        await onDelete();
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const handleUpdate = async (formData: any) => {
    if (!editingId) return;
    
    try {
      await updatePost(editingId, formData);
      setEditingId(null);
      if (onDelete) { // Using onDelete as refresh callback
        await onDelete();
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    }
  };

  return (
    <div>
      <SearchAndFilter
        onSearch={setSearchQuery}
        placeholder="Search posts..."
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPosts.map((post) => (
          <div key={post.id} className="bg-white shadow rounded-lg p-4">
            {editingId === post.id ? (
              <PostForm
                post={post}
                onSuccess={handleUpdate}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium">{post.title}</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(typeof post.id === 'string' ? parseInt(post.id) : post.id)}
                      className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post)}
                      className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {post.brief && (
                  <p className="text-sm text-gray-500 mt-2">{post.brief}</p>
                )}
                {post.imageUrl && (
                  <img 
                    src={post.imageUrl} 
                    alt={post.title}
                    className="mt-4 w-full h-40 object-cover rounded"
                  />
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
