'use strict';

const ConfigRepository = require('@models/ConfigRepository');

describe('ConfigRepository', () => {
  let mockDb;
  let repo;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      queryOne: jest.fn(),
    };
    repo = new ConfigRepository(mockDb);
  });

  test('init executes batch insert and warms cache in 1 query', async () => {
    mockDb.query
      .mockResolvedValueOnce({ affectedRows: 2 }) // INSERT IGNORE
      .mockResolvedValueOnce([                    // SELECT
        { key: 'gemini_model', value: 'gemini-2.5-flash' },
        { key: 'schedule_timezone', value: 'Asia/Ho_Chi_Minh' },
      ]);

    await repo.init();

    // Verify batch insert was called once with placeholders
    expect(mockDb.query).toHaveBeenCalledTimes(2);
    const firstCall = mockDb.query.mock.calls[0];
    expect(firstCall[0]).toContain('INSERT IGNORE INTO config');
    expect(firstCall[0]).toContain('VALUES');

    // Verify cache has values
    expect(repo.get('gemini_model')).toBe('gemini-2.5-flash');
    expect(repo.get('schedule_timezone')).toBe('Asia/Ho_Chi_Minh');
    expect(repo.get('non_existent')).toBeNull();
  });

  test('set writes to DB before updating local cache', async () => {
    mockDb.query.mockResolvedValueOnce({ affectedRows: 1 });

    await repo.set('test_key', 'test_value');

    expect(mockDb.query).toHaveBeenCalledWith(
      'INSERT INTO config (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
      ['test_key', 'test_value', 'test_value']
    );
    expect(repo.get('test_key')).toBe('test_value');
  });

  test('set does not corrupt cache if DB query throws error', async () => {
    mockDb.query.mockRejectedValueOnce(new Error('DB Connection Lost'));

    await expect(repo.set('failing_key', 'fail_val')).rejects.toThrow('DB Connection Lost');
    expect(repo.get('failing_key')).toBeNull();
  });

  test('refreshIfNeeded triggers reload only after TTL expires', async () => {
    mockDb.query
      .mockResolvedValueOnce([]) // init insert
      .mockResolvedValueOnce([{ key: 'k1', value: 'v1' }]); // init load

    await repo.init();
    expect(mockDb.query).toHaveBeenCalledTimes(2);

    // Call immediately - should NOT query DB because TTL has not passed
    await repo.refreshIfNeeded();
    expect(mockDb.query).toHaveBeenCalledTimes(2);
  });
});

