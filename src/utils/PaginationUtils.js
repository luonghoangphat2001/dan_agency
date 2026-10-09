'use strict';

/**
 * Shared Pagination Utility for parsing request pagination parameters
 * and building standardized paginated response payloads.
 */
class PaginationUtils {
  /**
   * Parse pagination parameters from request query with safe min/max limits.
   * @param {object} query - req.query object
   * @param {object} [options={}]
   * @param {number} [options.defaultLimit=50]
   * @param {number} [options.maxLimit=200]
   * @param {number} [options.defaultPage=1]
   * @returns {{ page: number, limit: number, offset: number }}
   */
  static parse(query = {}, { defaultLimit = 50, maxLimit = 200, defaultPage = 1 } = {}) {
    const rawLimit = Number(query.limit ?? query.per_page ?? defaultLimit);
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? defaultLimit : rawLimit), maxLimit);

    let page = defaultPage;
    let offset = 0;

    if (query.offset !== undefined && query.offset !== null) {
      const rawOffset = Number(query.offset);
      offset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset);
      page = Math.floor(offset / limit) + 1;
    } else if (query.page !== undefined && query.page !== null) {
      const rawPage = Number(query.page);
      page = Math.max(1, isNaN(rawPage) ? defaultPage : rawPage);
      offset = (page - 1) * limit;
    }

    return { page, limit, offset };
  }

  /**
   * Format paginated items into a standardized paginated response object.
   * @param {Array<any>} items
   * @param {number} total
   * @param {number} page
   * @param {number} limit
   * @returns {{ items: Array<any>, total: number, page: number, limit: number, totalPages: number, hasNext: boolean, hasPrev: boolean }}
   */
  static format(items = [], total = 0, page = 1, limit = 50) {
    const safeTotal = Math.max(0, Number(total) || 0);
    const safeLimit = Math.max(1, Number(limit) || 50);
    const safePage = Math.max(1, Number(page) || 1);
    const totalPages = Math.ceil(safeTotal / safeLimit);

    return {
      items: Array.isArray(items) ? items : [],
      total: safeTotal,
      page: safePage,
      limit: safeLimit,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    };
  }
}

module.exports = PaginationUtils;
