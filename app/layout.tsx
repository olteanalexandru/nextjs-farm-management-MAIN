import './globals.css';
import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import '../styles/globalsBot.css';
import { getLocale, getMessages } from 'next-intl/server';
import RootProvider from './RootProvider';
import ModernLayout from './components/ModernLayout';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { initDatabase } from './db-init';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  
  // Initialize database connection
  try {
    await initDatabase();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Continue rendering the app even if database init fails
    // The connection retry logic in warmupDatabase will handle reconnection attempts
  }

  return (
    <html lang={locale}>
      <UserProvider>
        <body>
          <RootProvider locale={locale} messages={messages}>
            <ModernLayout>
              {children}
            </ModernLayout>
          </RootProvider>
        </body>
      </UserProvider>
    </html>
  );
}
