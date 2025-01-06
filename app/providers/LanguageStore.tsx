"use client";

import { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

type Locale = 'en' | 'ro';

interface LanguageContextType {
  currentLanguage: Locale;
  setLanguage: (locale: Locale) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Locale>(
    (Cookies.get('language') as Locale) || 'en'
  );

  const setLanguage = useCallback(async (locale: Locale) => {
    try {
      // Set cookie on client side
      Cookies.set('language', locale);
      
      // Update server-side
      await axios.post('/api/Controllers/SetLanguage', { locale });
      
      setCurrentLanguage(locale);
      window.location.reload();
    } catch (error) {
      console.error('Failed to set language:', error);
      throw error;
    }
  }, []);

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      setLanguage
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
