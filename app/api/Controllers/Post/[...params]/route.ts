import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { prisma } from 'app/lib/prisma';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse, Post, PostCreate } from 'app/types/api';

export { GET } from './get';
export { POST } from './post';
export { PUT } from './put';
export { DELETE } from './delete';
