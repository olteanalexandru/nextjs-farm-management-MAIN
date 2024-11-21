'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import PostForm from '../Crud/PostForm';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CreatePost() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/api/auth/login');
      return;
    }

    // Create/update user in our database when authenticated
    if (user) {
      fetch('/api/Controllers/User', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      }).catch(error => {
        console.error('Error creating/updating user:', error);
      });
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Post</h1>
      <PostForm />
    </div>
  );
}
