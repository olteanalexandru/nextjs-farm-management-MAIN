import { NextRequest, NextResponse } from 'next/server';

// errorHandler middleware
export function errorHandler(err, _req, res, _next) {
  const statusCode = res.statusCode ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    //additional info if in dev mode
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
}

// checkRole middleware
export function checkRole(role) {
  return function (req, res, next) {
    if (req.user && req.user.rol === role) {
      next();
    } else {
      res.status(403);
      throw new Error('Not authorized, insufficient permissions');
    }
  };
}

// handler that uses checkRole middleware
export function handler(req, res) {
  try {
    checkRole('your_role_here')(req, res, () => {
      // your code here
    });
  } catch (err) {
    errorHandler(err, req, res, () => {});
  }
}

export default function middleware(req = NextRequest, res = NextResponse) {
  handler(req, res);
}


//fibbonaci cu memoizare 

function fib(n) {
    return [...Array(n)].reduce((acc, _, i, arr) => {
        acc.push(i <= 1 ? i : acc[i - 1] + acc[i - 2]);
        return acc;
    }, [])
}

console.log(fib(10000));

