'use client';
import { ReactNode } from 'react';

import { UserProvider as AppUserProvider } from './providers/UserStore';
import { GlobalContextProvider as CulturaProvider } from './providers/culturaStore';
import { GlobalContextProvider as RotationProvider } from './providers/rotationStore';
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

    <AppUserProvider>

        <CulturaProvider>
          <RotationProvider>
            <PostProvider>
              {wrappedChildren}
            </PostProvider>
          </RotationProvider>
        </CulturaProvider>
      
    </AppUserProvider>

  );
};

export default RootProvider;
