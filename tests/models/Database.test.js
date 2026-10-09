'use strict';

const Database = require('@models/Database');
const mysql = require('mysql2/promise');

jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(),
}));

jest.mock('@database', () => jest.fn().mockResolvedValue());

describe('Database', () => {
  let db;

  beforeEach(() => {
    db = new Database();
    jest.clearAllMocks();
  });

  test('throws descriptive error if queried before init()', async () => {
    await expect(db.query('SELECT 1')).rejects.toThrow(
      '[Database] Connection pool is not initialized. Please call init() first.'
    );
  });

  test('transaction throws error if executed before init()', async () => {
    await expect(db.transaction(async () => {})).rejects.toThrow(
      '[Database] Connection pool is not initialized. Please call init() first.'
    );
  });

  test('transaction commits on success and releases connection', async () => {
    const mockConn = {
      beginTransaction: jest.fn().mockResolvedValue(),
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn(),
    };
    const mockPool = {
      getConnection: jest.fn().mockResolvedValue(mockConn),
      end: jest.fn().mockResolvedValue(),
    };
    mysql.createPool.mockReturnValue(mockPool);

    await db.init();

    const result = await db.transaction(async (conn) => {
      expect(conn).toBe(mockConn);
      return 'done';
    });

    expect(result).toBe('done');
    expect(mockConn.beginTransaction).toHaveBeenCalled();
    expect(mockConn.commit).toHaveBeenCalled();
    expect(mockConn.rollback).not.toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalled();
  });

  test('transaction rolls back on error and releases connection', async () => {
    const mockConn = {
      beginTransaction: jest.fn().mockResolvedValue(),
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn(),
    };
    const mockPool = {
      getConnection: jest.fn().mockResolvedValue(mockConn),
      end: jest.fn().mockResolvedValue(),
    };
    mysql.createPool.mockReturnValue(mockPool);

    await db.init();

    await expect(
      db.transaction(async () => {
        throw new Error('Query Failed');
      })
    ).rejects.toThrow('Query Failed');

    expect(mockConn.beginTransaction).toHaveBeenCalled();
    expect(mockConn.rollback).toHaveBeenCalled();
    expect(mockConn.commit).not.toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalled();
  });

  test('close terminates the pool cleanly', async () => {
    const mockPool = {
      end: jest.fn().mockResolvedValue(),
    };
    mysql.createPool.mockReturnValue(mockPool);

    await db.init();
    expect(db.pool).toBe(mockPool);

    await db.close();
    expect(mockPool.end).toHaveBeenCalled();
    expect(db.pool).toBeNull();
  });
});

