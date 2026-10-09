'use strict';

const BaseRepository = require('@models/BaseRepository');

class TestRepository extends BaseRepository {
  constructor(db) {
    super(db, 'test_table');
  }
}

describe('BaseRepository', () => {
  let mockDb;
  let repo;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      queryOne: jest.fn(),
    };
    repo = new TestRepository(mockDb);
  });

  test('prevents direct instantiation of abstract class', () => {
    expect(() => new BaseRepository(mockDb)).toThrow(TypeError);
  });

  test('findById executes queryOne', async () => {
    mockDb.queryOne.mockResolvedValue({ id: 5, name: 'Item 5' });
    const result = await repo.findById(5);

    expect(mockDb.queryOne).toHaveBeenCalledWith('SELECT * FROM test_table WHERE id = ? LIMIT 1', [5]);
    expect(result).toEqual({ id: 5, name: 'Item 5' });
  });

  test('count returns total row count', async () => {
    mockDb.queryOne.mockResolvedValue({ total: 42 });
    const total = await repo.count('status = ?', ['active']);

    expect(mockDb.queryOne).toHaveBeenCalledWith('SELECT COUNT(*) AS total FROM test_table WHERE status = ?', ['active']);
    expect(total).toBe(42);
  });

  test('deleteById executes DELETE query', async () => {
    mockDb.query.mockResolvedValue({ affectedRows: 1 });
    const success = await repo.deleteById(10);

    expect(mockDb.query).toHaveBeenCalledWith('DELETE FROM test_table WHERE id = ?', [10]);
    expect(success).toBe(true);
  });

  test('existsById returns boolean based on presence', async () => {
    mockDb.queryOne.mockResolvedValueOnce({ found: 1 });
    const exists = await repo.existsById(5);
    expect(mockDb.queryOne).toHaveBeenCalledWith('SELECT 1 AS found FROM test_table WHERE id = ? LIMIT 1', [5]);
    expect(exists).toBe(true);

    mockDb.queryOne.mockResolvedValueOnce(null);
    const notExists = await repo.existsById(999);
    expect(notExists).toBe(false);
  });

  test('findAll executes SELECT query with limit and offset', async () => {
    mockDb.query.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const results = await repo.findAll({ limit: 50, offset: 10, orderBy: 'created_at DESC' });

    expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM test_table ORDER BY created_at DESC LIMIT ? OFFSET ?', [50, 10]);
    expect(results).toHaveLength(2);
  });

  test('paginateQuery executes SQL with limit and offset', async () => {
    mockDb.query.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const result = await repo.paginateQuery('SELECT * FROM test_table', [], { page: 2, limit: 10 });

    expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM test_table LIMIT ? OFFSET ?', [10, 10]);
    expect(result.items).toHaveLength(2);
    expect(result.page).toBe(2);
  });
});
