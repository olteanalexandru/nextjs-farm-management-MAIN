"use client";

import React from 'react';
import Cookies from 'js-cookie';

type Locale = 'en' | 'ro';

export const LanguageSwitch = () => {
    const setLocale = async (locale: Locale) => {
        try {
            // Set the cookie on the client side for immediate effect
            Cookies.set('language', locale);

            // Make a request to the backend to set the cookie
            await fetch('/api/Controllers/SetLanguage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ locale })
            });

            window.location.reload();
        } catch (error) {
            console.error('Failed to set language:', error);
        }
    };

    const currentLanguage = Cookies.get('language') as Locale | undefined;

    return (
        <div className="flex flex-col space-y-1">
            <button
                className={`px-2 py-1 font-bold text-sm transition-colors hover:text-green-600 ${
                    currentLanguage === 'ro' ? 'text-green-600' : 'text-gray-700'
                }`}
                onClick={() => setLocale('ro')}
                aria-label="Switch to Romanian"
            >
                RO
            </button>
            <button
                className={`px-2 py-1 font-bold text-sm transition-colors hover:text-green-600 ${
                    currentLanguage === 'en' ? 'text-green-600' : 'text-gray-700'
                }`}
                onClick={() => setLocale('en')}
                aria-label="Switch to English"
            >
                EN
            </button>
        </div>
    );
};
