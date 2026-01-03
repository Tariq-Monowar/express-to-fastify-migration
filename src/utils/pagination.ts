 

interface PaginationOptions {
  page?: number;
  limit?: number;
}

interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

export const getPaginationOptions = (request): PaginationOptions => {
  const page = parseInt(request.query.page as string) || DEFAULT_PAGE;
  const limit = parseInt(request.query.limit as string) || DEFAULT_LIMIT;
  return { page, limit };
};

export const getPaginationResult = <T>(
  data: T[],
  total: number,
  options: PaginationOptions
): PaginationResult<T> => {
  const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = options;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};