export interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
  }
  
  export interface PaginationParams {
    page?: number;
    limit?: number;
    orderBy?: string;
    order?: 'asc' | 'desc';
  }