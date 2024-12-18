import { UserProvider } from '@auth0/nextjs-auth0/client';
import './globals.css';
import { Inter } from 'next/font/google';
import ModernLayout from './components/ModernLayout';
import RootProvider from './RootProvider';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <UserProvider>
        <RootProvider locale="en" messages={{}}>
          <body className={inter.className}>
            <ModernLayout>
              {children}
            </ModernLayout>
          </body>
        </RootProvider>
      </UserProvider>
    </html>
  );
}
