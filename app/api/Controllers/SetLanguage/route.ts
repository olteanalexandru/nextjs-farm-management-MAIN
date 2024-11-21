import { NextResponse, NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    const { locale } = await request.json();
    const response = NextResponse.next();

    response.cookies.set('language', locale, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 60 * 60 * 24 * 12, // 2 weeks
        sameSite: 'strict',
    });
    
    return NextResponse.json({ message: 'Language set to ' + locale }, { status: 201 });
}
