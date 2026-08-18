export type ApiResponse<T> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: ApiError;
    };

export type ApiError = {
  message: string;
  code?: string;
  status?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
};
