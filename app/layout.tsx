import { UserProvider } from '@auth0/nextjs-auth0/client';
import './globals.css';
import { Inter } from 'next/font/google';
import ModernLayout from './components/ModernLayout';
import RootProvider from './RootProvider';
import ServiceWorkerRegistrar from './components/ServiceWorkerRegistrar';
import { NextIntlClientProvider } from 'next-intl';
import { getServerLocale, getServerMessages } from 'lib/i18n-server';

const inter = Inter({ subsets: ['latin'] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getServerLocale();
  const messages = await getServerMessages(locale);

  return (
    <html lang={locale}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16a34a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/Logo.png" />
      </head>
      <UserProvider>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <RootProvider locale={locale} messages={messages}>
            <body className={inter.className}>
              <ServiceWorkerRegistrar />
              <ModernLayout>
                {children}
              </ModernLayout>
            </body>
          </RootProvider>
        </NextIntlClientProvider>
      </UserProvider>
    </html>
  );
}
