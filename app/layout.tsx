import './globals.css'
import React from 'react'
import Header from './header'
import Footer from './footer'

import 'bootstrap/dist/css/bootstrap.css'
import {GlobalContextProvider} from './providers/UserStore'
import {GlobalContextProvider as CulturaStore} from './providers/culturaStore'
import {GlobalContextProvider as PostStore } from './providers/postStore'
import '../styles/globalsBot.css';
// import Auth0ProviderWithHistory from './Auth0ProviderWrapper';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import {NextIntlClientProvider} from 'next-intl';
import {getLocale, getMessages} from 'next-intl/server';
import RootProvider from './RootProvider';
import ModernLayout from '@/app/componets/ModernLayout';


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <RootProvider locale={locale} messages={messages}>
          <ModernLayout>
            {children}
          </ModernLayout>
        </RootProvider>
      </body>
    </html>
  );
}