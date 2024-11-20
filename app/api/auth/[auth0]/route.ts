// app/api/auth/[auth0]/route.ts
import { handleAuth } from "@auth0/nextjs-auth0";
import { NextRequest } from 'next/server';
//improting prisma
import { prisma } from '@/app/lib/prisma';

export const GET = handleAuth();

// const adminEmails = process.env.ADMIN_EMAILS.split(',');
 const adminEmails = ['oltean.alexandru11@gmail.com'];
//ADMIN
export async function handler(
  req: NextRequest,
  context: { params: { auth0: string } }
): Promise<Response> {
  const auth0Route = await GET(req, context);
 // upsert // Update or create user in database id, auth0Id, name, email, roleType
  if (auth0Route.status === 200) {
    const { user } = auth0Route.body;
    const { email, name, sub } = user;
    const roleType = adminEmails.includes(email) ? 'ADMIN' : 'FARMER';
    await prisma.user.upsert({
      where: { auth0Id: sub },
      update: { name, email, roleType },
      create: { auth0Id: sub, name, email, roleType },
    });
  }



  
  return auth0Route;
}
