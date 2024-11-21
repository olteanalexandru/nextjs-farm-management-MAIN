import 'bootstrap/dist/css/bootstrap.min.css';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { PostProvider } from '../providers/postStore';

export default function CreatePostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <PostProvider>
        {children}
      </PostProvider>
    </UserProvider>
  );
}
