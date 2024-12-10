
import { getSession } from '@auth0/nextjs-auth0';



export default async function authenticateUser() {
    const session = await getSession();
    if (!session?.user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return session;
  }