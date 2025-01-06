'use client';
import { ReactNode } from 'react';

import { UserProvider as AppUserProvider } from './providers/UserStore';
import { GlobalContextProvider as CulturaProvider } from './providers/culturaStore';
import { GlobalContextProvider as RotationProvider } from './providers/rotationStore';
import { AdminProvider } from './providers/AdminStore';
import { CropWikiProvider } from './providers/CropWikiStore';

import { PostProvider } from './providers/postStore'; 
import { NextIntlClientProvider } from 'next-intl';

interface RootProviderProps {
  children: ReactNode;
  locale: string;
  messages: any;
}

const RootProvider = ({ children, locale, messages }: RootProviderProps) => {
  const wrappedChildren = (
    <NextIntlClientProvider 
      locale={locale} 
      messages={messages}
      timeZone="Europe/Bucharest"
    >
      {children}
    </NextIntlClientProvider>
  );

  return (
    <AppUserProvider>
        <AdminProvider>
        <CulturaProvider>
          <RotationProvider>
            <PostProvider>
              <CropWikiProvider>
              {wrappedChildren}
              </CropWikiProvider>
            </PostProvider>
          </RotationProvider>
        </CulturaProvider>
      </AdminProvider>
    </AppUserProvider>
  );
};

export default RootProvider;
