
const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    }
    return process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://your-production-domain.com';
  };
  
  export const API_ROUTES = {
    base: getBaseUrl(),
    controllers: {
      crop: `${getBaseUrl()}/api/Controllers/Crop`,
      post: `${getBaseUrl()}/api/Controllers/Post`,
      rotation: `${getBaseUrl()}/api/Controllers/Rotation`,
      user: `${getBaseUrl()}/api/Controllers/User`,
      setLanguage: `${getBaseUrl()}/api/Controllers/SetLanguage`,
    }
  } as const;
  
  export const APP_CONFIG = {
    api: API_ROUTES,
    defaultLocale: 'ro',
    supportedLocales: ['en', 'ro'],
    itemsPerPage: 10,
  } as const;
  
  export default APP_CONFIG;