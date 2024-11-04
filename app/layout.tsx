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
import ModernLayout from '@/app/componets/ModernLayout';

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
    <html lang={locale} >
      <head />
      <body className="bg-light">
        <div className="d-flex flex-column align-items-center" style={{minHeight:'98vh'}}>
      
          <div className=" w-100">

        
         
 <UserProvider>
            <PostStore>
              <CulturaStore>
                <GlobalContextProvider>
              
                  <ModernLayout>
                  <Header />
                  <div className="container bg-white shadow-sm p-3 mb-5 rounded" style={{ maxWidth: '1400px' }}>
                  <NextIntlClientProvider messages={messages}>
                    {children}
                    </NextIntlClientProvider>
                  </div>
                  </ModernLayout>
                </GlobalContextProvider>
              </CulturaStore>
            </PostStore>
            </UserProvider>
          
          </div>
          <span className="
                text-2xl
                text-blue-500
                font-semibold
                text-center
                mt-10
          ">
                  Tailwind is working!
                </span>
                <p className="
                text-2xl
                text-blue-500
                font-semibold
                text-center
                mt-10

                
                ">
                  Tailwind is working if this text is blue, to the left and really big.
                </p>
          </div>
      
      <Footer />
      </body>
    </html>
  )
}


