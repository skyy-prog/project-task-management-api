const getOffset = (page, limit) => (page - 1) * limit;

const buildPagination = ({ total, page, limit }) => {
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

module.exports = { getOffset, buildPagination };
