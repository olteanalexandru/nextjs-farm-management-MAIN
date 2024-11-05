declare module '@auth0/nextjs-auth0/client' {
  export interface UserProfile {
    email?: string;
    email_verified?: boolean;
    name?: string;
    nickname?: string;
    picture?: string;
    sub?: string;
    updated_at?: string;
    org_id?: string;
    [key: string]: any;
  }

  export interface UserContext {
    user?: UserProfile;
    error?: Error;
    isLoading: boolean;
  }

  export function useUser(): UserContext;
}
