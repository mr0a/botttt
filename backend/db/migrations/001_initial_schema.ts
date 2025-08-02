import { Database } from '../../src/lib/database.js';

export const migration = {
  name: '001_initial_schema',
  up: (db: Database) => {
    console.log('Creating initial schema...');

    // Create markets table
    db.exec(`
      CREATE TABLE IF NOT EXISTS markets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        exchange TEXT NOT NULL,
        market_type TEXT NOT NULL,
        timezone TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create market_data table
    db.exec(`
      CREATE TABLE IF NOT EXISTS market_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        market_id INTEGER NOT NULL,
        timestamp DATETIME NOT NULL,
        open_price REAL,
        high_price REAL,
        low_price REAL,
        close_price REAL,
        volume INTEGER,
        bid REAL,
        ask REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (market_id) REFERENCES markets (id),
        UNIQUE(market_id, timestamp)
      )
    `);

    // Create indexes for better performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_market_data_market_id ON market_data(market_id);
      CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON market_data(timestamp);
      CREATE INDEX IF NOT EXISTS idx_markets_symbol ON markets(symbol);
    `);

    // Insert sample market data
    db.exec(`
      INSERT OR IGNORE INTO markets (symbol, name, exchange, market_type, timezone) VALUES
      ('BTCUSDT', 'Bitcoin/USDT', 'Binance', 'crypto', 'UTC'),
      ('ETHUSDT', 'Ethereum/USDT', 'Binance', 'crypto', 'UTC'),
      ('SOLUSDT', 'Solana/USDT', 'Binance', 'crypto', 'UTC')
    `);

    console.log('Initial schema created successfully');
  },
};
