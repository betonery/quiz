import type { ApiError, ApiResponse } from "@/types/api";

export function successResponse<T>(data: T): ApiResponse<T> {
  return { data, error: null };
}

export function errorResponse(
  message: string,
  code?: string,
  status?: number,
): ApiResponse<never> {
  const error: ApiError = { message, code, status };
  return { data: null, error };
}
