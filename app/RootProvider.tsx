'use client';
import { ReactNode } from 'react';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { UserProvider as AppUserProvider } from './providers/UserStore';
import { GlobalContextProvider as CulturaProvider } from './providers/culturaStore';
import { PostProvider } from './providers/postStore'; 
import { NextIntlClientProvider } from 'next-intl';

interface RootProviderProps {
  children: ReactNode;
  locale: string;
  messages: any;
}

const RootProvider = ({ children, locale, messages }: RootProviderProps) => {
  const wrappedChildren = (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );

  return (
    <UserProvider>

        <CulturaProvider>
          <AppUserProvider>
            <PostProvider> {/* Wrap children with PostProvider */}
              {wrappedChildren}
            </PostProvider>
          </AppUserProvider>
        </CulturaProvider>

    </UserProvider>
  );
};

export default RootProvider;