'use strict';

const PaginationUtils = require('@utils/PaginationUtils');

describe('PaginationUtils', () => {
  describe('parse()', () => {
    test('uses defaults when query is empty', () => {
      const result = PaginationUtils.parse({});
      expect(result).toEqual({ page: 1, limit: 50, offset: 0 });
    });

    test('parses limit and page correctly', () => {
      const result = PaginationUtils.parse({ page: '3', limit: '20' });
      expect(result).toEqual({ page: 3, limit: 20, offset: 40 });
    });

    test('parses offset correctly and calculates page', () => {
      const result = PaginationUtils.parse({ offset: '60', limit: '20' });
      expect(result).toEqual({ page: 4, limit: 20, offset: 60 });
    });

    test('caps limit to maxLimit', () => {
      const result = PaginationUtils.parse({ limit: '1000' }, { maxLimit: 100 });
      expect(result.limit).toBe(100);
    });
  });

  describe('format()', () => {
    test('formats paginated payload correctly', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const result = PaginationUtils.format(items, 50, 2, 20);

      expect(result).toEqual({
        items,
        total: 50,
        page: 2,
        limit: 20,
        totalPages: 3,
        hasNext: true,
        hasPrev: true,
      });
    });

    test('handles edge case totals and page boundaries', () => {
      const result = PaginationUtils.format([], 0, 1, 10);

      expect(result).toEqual({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      });
    });
  });
});
