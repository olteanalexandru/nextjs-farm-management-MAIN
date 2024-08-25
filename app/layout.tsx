import React from 'react'
import Header from './header'
import Footer from './footer'

import 'bootstrap/dist/css/bootstrap.css'
import {GlobalContextProvider} from './Context/UserStore'
import {GlobalContextProvider as CulturaStore} from './Context/culturaStore'
import {GlobalContextProvider as PostStore } from './Context/postStore'
import '../styles/globalsBot.css';
// import Auth0ProviderWithHistory from './Auth0ProviderWrapper';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import {NextIntlClientProvider} from 'next-intl';
import {getLocale, getMessages} from 'next-intl/server';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const locale = await getLocale();
 
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();


  return (
    <html lang={locale}>
      <head />
      <body className="bg-light">
        <div className="d-flex flex-column align-items-center" style={{minHeight:'98vh'}}>
        
          <div className=" w-100">
           
 <UserProvider>
            <PostStore>
              <CulturaStore>
                <GlobalContextProvider>
                  <Header />
                  <div className="container bg-white shadow-sm p-3 mb-5 rounded" style={{ maxWidth: '1400px' }}>
                  <NextIntlClientProvider messages={messages}>
                    {children}
                    </NextIntlClientProvider>
                  </div>
                </GlobalContextProvider>
              </CulturaStore>
            </PostStore>
            </UserProvider>
          
          </div>
          </div>
      
      <Footer />
      </body>
    </html>
  )
}