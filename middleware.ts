

// errorHandler middleware
// export function errorHandler(err, _req, res, _next) {
//   const statusCode = res.statusCode ? res.statusCode : 500;
//   res.status(statusCode);
//   res.json({
//     message: err.message,
//     //additional info if in dev mode
//     stack: process.env.NODE_ENV === 'production' ? null : err.stack
//   });
// }



// handler that uses checkRole middleware
// export function handler(req, res) {
//   try {
//     checkRole('your_role_here')(req, res, () => {
//       // your code here
//     });
//   } catch (err) {
//     errorHandler(err, req, res, () => {});
//   }
// }

// export default function middleware(req = NextRequest, res = NextResponse) {
//   handler(req, res);
// }


// middleware.js




// function fib3(n) {
//   let sequence = [0, 1];
//   [...Array(n)].forEach((_, i) => {
//     if (i >= 2) {
//       sequence[i] = sequence[i - 1] + sequence[i - 2];
//     }
//   });
//   return sequence;
// }

// function fib2(n) {
//   let sequence = [];
//   [...Array(n)].forEach((_, i) => {
//     sequence[i] = i <= 1? i : fib2(i - 1) + fib2(i - 2) ;
//   });
//   return sequence;
// }


// function fib2Recursive(n) {
//   return [...Array(n)].map((_, i) => i <= 1? i : fib2(i - 1) + fib2(i - 2));
// }

// function fib(n) {
//     return [...Array(n)].reduce((acc, _, i, arr) => {
//         acc.push(i <= 1 ? i : acc[i - 1] + acc[i - 2]);
//         return acc;
//     }, [])
// }

// function fibMemo(n, memo = {}) {
//   return [...Array(n)].map((_, i) => i <= 1 ? i : memo[i] || (memo[i] =
//     fib2(i - 1, memo) + fib2(i - 2, memo)));
// }

// middleware.js
import { withMiddlewareAuthRequired , getSession} from '@auth0/nextjs-auth0/edge';
import { NextRequest, NextResponse } from 'next/server';
// connectDB();

const checkRole = async (role: string, next: () => void, res: NextResponse) => {
  if (role.length > 0) {
    next();
  } else {
    // res.status(403);
    throw new Error('Not authorized, insufficient permissions');
  }
}
  


const myMiddleware = async (
  req: NextRequest,
  res: NextResponse
) => {
  // const res = NextResponse.next();
  const user = await getSession(req, res);

 
  console.log('Hello from authed middleware' + "User infos access " + user.user.userRoles)

}

export default withMiddlewareAuthRequired(myMiddleware);
export const config = {
  matcher: '/Crud/:path*',
  exclude: ['/Crud/GetAllPosts/'],
  include: ['/pages/Rotatie/:path*', '/pages/Login/Dashboard/:path*'],
};


