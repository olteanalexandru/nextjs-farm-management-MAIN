import { ReactNode } from 'react';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { GlobalContextProvider as UserStore } from './providers/UserStore';
import { GlobalContextProvider as CropStore } from './providers/culturaStore';
import { GlobalContextProvider as PostStore } from './providers/postStore';
import { NextIntlClientProvider } from 'next-intl';

interface RootProviderProps {
  children: ReactNode;
  locale: string;
  messages: any;
}

const RootProvider = ({ children, locale, messages }: RootProviderProps) => {
  return (
    <UserProvider>
      <PostStore>
        <CropStore>
          <UserStore>
            <NextIntlClientProvider locale={locale} messages={messages}>
              {children}
            </NextIntlClientProvider>
          </UserStore>
        </CropStore>
      </PostStore>
    </UserProvider>
  );
};

export default RootProvider;