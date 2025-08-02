import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { Database } from '../lib/database.js';
import { Migrator } from '../lib/migrator.js';
import { migration } from '../../db/migrations/001_initial_schema.js';

describe('Database', () => {
  let db: Database;
  let migrator: Migrator;

  beforeEach(() => {
    db = new Database({ filename: ':memory:' });
    db.connect();
    migrator = new Migrator(db);
  });

  afterEach(() => {
    db.close();
  });

  test('should connect successfully', () => {
    const health = db.healthCheck();
    expect(health.status).toBe('healthy');
    expect(health.details.connected).toBe(true);
  });

  test('should run migrations successfully', () => {
    migrator.runMigrations([migration]);

    // Check if tables were created
    const marketsResult = db.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='markets'"
    );
    expect(marketsResult.rowCount).toBe(1);

    const marketDataResult = db.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='market_data'"
    );
    expect(marketDataResult.rowCount).toBe(1);

    // Check if sample data was inserted
    const markets = db.query('SELECT * FROM markets');
    expect(markets.rowCount).toBeGreaterThan(0);
  });

  test('should handle basic queries', () => {
    migrator.runMigrations([migration]);

    const result = db.query('SELECT * FROM markets WHERE symbol = ?', [
      'BTCUSDT',
    ]);
    expect(result.rowCount).toBe(1);

    const market = result.rows[0] as { symbol: string };
    expect(market.symbol).toBe('BTCUSDT');
  });
});
