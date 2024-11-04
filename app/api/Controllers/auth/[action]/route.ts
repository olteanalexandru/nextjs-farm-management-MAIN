import { handleAuth, handleLogin, handleCallback, handleLogout } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
    login: handleLogin({
        returnTo: '/pages/Login/Dashboard'
    }),
    callback: handleCallback({
        redirectUri: process.env.AUTH0_REDIRECT_URI
    }),
    logout: handleLogout({
        returnTo: process.env.AUTH0_BASE_URL
    })
});

// Modified to handle async params
export async function getAuth0Handler(params: { auth0: string }) {
    // Await the params if they come from an async source
    const auth0Param = await params.auth0;

    const handlers = {
        'login': handleLogin({
            returnTo: '/pages/Login/Dashboard'
        }),
        'callback': handleCallback({
            redirectUri: process.env.AUTH0_REDIRECT_URI
        }),
        'logout': handleLogout({
            returnTo: process.env.AUTH0_BASE_URL
        })
    };

    const handler = handlers[auth0Param] || handleAuth();
    return handler;
}