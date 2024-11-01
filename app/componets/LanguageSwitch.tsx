import React from 'react';
import Cookies from 'js-cookie';

export const LanguageSwitch = () => {
    const setLocale = async (locale) => {
      // Set the cookie on the client side for immediate effect
      Cookies.set('language', locale);
      window.location.reload();
  
      // Make a request to the backend to set the cookie
      await fetch('/api/set-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale })
      });
    };
  
    const language = Cookies.get('language');
    console.log(language);
  
    return (
      <div>
        <button
          style={{
            background: 'none',
            border: 'none',
            fontWeight: 'bold',
            color: 'black',
            display: 'block',
            marginBottom: '0px' // Add spacing between buttons
          }}
          onClick={() => {
            setLocale('ro');
          }}
        >
          RO
        </button>
        <button
          style={{
            background: 'none',
            border: 'none',
            fontWeight: 'bold',
            color: 'black',
            display: 'block'
          }}
          onClick={() => {
            setLocale('en');
          }}
        >
          EN
        </button>
      </div>
    );
  };              