export function getPagination(query) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
  const offset = (page - 1) * limit;

  return { limit, offset, page };
}

export function pagedResponse({ count, limit = 20, page, rows }) {
  return {
    data: rows,
    meta: {
      page,
      pages: Math.max(Math.ceil(count / Math.max(limit, 1)), 1),
      total: count,
    },
  };
}
