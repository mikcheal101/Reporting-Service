export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function getPaginationParams(
  page?: number,
  limit?: number,
  maxLimit = 100,
): PaginationOptions {
  const p = page && page > 0 ? page : 1;
  const l = limit && limit > 0 ? Math.min(limit, maxLimit) : 20;
  return { page: p, limit: l };
}

export function paginate<T>(
  data: T[],
  total: number,
  options: PaginationOptions,
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / options.limit) || 1;
  return {
    data,
    meta: {
      total,
      page: options.page,
      limit: options.limit,
      totalPages,
      hasNextPage: options.page < totalPages,
      hasPreviousPage: options.page > 1,
    },
  };
}
