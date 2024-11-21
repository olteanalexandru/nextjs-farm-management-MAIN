import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


export default function middleware(request: NextRequest) {
  //just console log the request
  // console.log(request)
  return NextResponse.next();
}