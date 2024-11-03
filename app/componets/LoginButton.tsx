'use client';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function LoginButton() {
  const { user, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="flex items-center gap-2">
      {user ? (
        <div className="flex items-center gap-2">
          {user.picture && (
            <img 
              src={user.picture} 
              alt="Profile" 
              className="h-8 w-8 rounded-full"
            />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.name}</span>
            <a href="/api/auth/logout" className="text-sm text-gray-600 hover:text-gray-900">
              Logout
            </a>
          </div>
        </div>
      ) : (
        <a 
          href="/api/auth/login"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Login
        </a>
      )}
    </div>
  );
}