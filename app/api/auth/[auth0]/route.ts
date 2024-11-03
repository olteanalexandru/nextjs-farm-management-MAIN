import { handleAuth, handleCallback } from '@auth0/nextjs-auth0';
import prisma from '@/app/lib/prisma';

export const GET = handleAuth({
  callback: async (req, res) => {
    const response = await handleCallback(req, res);
    const { user } = response as unknown as { user: { sub: string, email: string, name: string } };
    
    // Create/update user in database
    await prisma.user.upsert({
      where: { id: user.sub },
      create: {
        id: user.sub,
        email: user.email,
        name: user.name,
      },
      update: {
        email: user.email,
        name: user.name, 
      }
    });

    return user;
  }
});
// BF99X4UACE1UEP857PMNY46M