"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Container, Button, Form } from 'react-bootstrap';
import { usePostContext } from '../../../providers/postStore';
import { useUserContext } from '../../../providers/UserStore';

export default function SinglePost() {
  const postId = useSearchParams().get("post") as string;
  const { data, loading, getPost, deletePost, updatePost } = usePostContext();
  const { data: user } = useUserContext();
  const isAdmin = user?.roleType.toLowerCase() === 'admin';
  const [editMode, setEditMode] = useState(false);
  const [updatedPost, setUpdatedPost] = useState({
    title: '',
    brief: '',
    description: '',
  });

  useEffect(() => {
    if (postId) {
      getPost(postId);
    }
  }, [postId]);

  useEffect(() => {
    if (data.length > 0) {
      const post = data[0];
      setUpdatedPost({
        title: post.title || '',
        brief: post.brief || '',
        description: post.description || '',
      });
    }
  }, [data]);

  const handleDelete = async () => {
    if (data[0]?.id) {
      await deletePost(data[0].id);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (data[0]?.id) {
      await updatePost(data[0].id, {
        title: updatedPost.title,
        brief: updatedPost.brief,
        description: updatedPost.description,
      });
      setEditMode(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUpdatedPost(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">Article not found</h1>
          <p className="text-gray-600">The article you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const post = data[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {editMode ? (
        <Form onSubmit={handleUpdate} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Edit Article</h2>
            <Form.Group className="mb-4">
              <Form.Label className="font-medium text-gray-700">Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={updatedPost.title}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="font-medium text-gray-700">Brief</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="brief"
                value={updatedPost.brief}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </Form.Group>
            <Form.Group className="mb-6">
              <Form.Label className="font-medium text-gray-700">Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                name="description"
                value={updatedPost.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </Form.Group>
            <div className="flex gap-3">
              <Button 
                variant="primary" 
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save Changes
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setEditMode(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Form>
      ) : (
        <article className="bg-white rounded-lg shadow-sm border border-gray-200">
          {post.imageUrl && (
            <div className="w-full h-[400px] relative rounded-t-lg overflow-hidden">
              <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="object-cover w-full h-full"
              />
            </div>
          )}
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <time>{new Date(post.createdAt).toLocaleDateString()}</time>
                {post.author && (
                  <>
                    <span>•</span>
                    <span>{post.author}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="prose prose-lg max-w-none">
              {post.brief && <p className="text-xl text-gray-600 mb-8">{post.brief}</p>}
              <div className="text-gray-800 whitespace-pre-wrap">{post.description}</div>
            </div>

            {isAdmin && (
              <div className="mt-12 pt-6 border-t border-gray-200 flex gap-4">
                <Button 
                  variant="danger" 
                  onClick={handleDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Delete Article
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => setEditMode(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Edit Article
                </Button>
              </div>
            )}
          </div>
        </article>
      )}
    </div>
  );
}
