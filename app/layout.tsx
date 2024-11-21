import './globals.css';
import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import '../styles/globalsBot.css';
import { getLocale, getMessages } from 'next-intl/server';
import RootProvider from './RootProvider';
import ModernLayout from './components/ModernLayout';
import { UserProvider } from '@auth0/nextjs-auth0/client';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

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
