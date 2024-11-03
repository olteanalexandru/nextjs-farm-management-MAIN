export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  posts?: any;
  status?: number;
}

export interface Post {
  id: number;
  title: string;
  brief: string;
  description: string;
  image?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    name: string;
    email: string;
  };
}
