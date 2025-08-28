import type { PgClient } from "../../src/lib/database";

export const version = "3.0.0";
export const description =
  "Create tables for instrument types, open interest, and daily OHLCV";

export async function up(client: PgClient): Promise<void> {
  // Create stock table for stock-specific data
  await client.query(`
    CREATE TABLE IF NOT EXISTS stock (
      stock_id SERIAL PRIMARY KEY,
      instrument_id INTEGER NOT NULL REFERENCES instrument(instrument_id),
      isin VARCHAR(12),
      sector VARCHAR(100),
      industry VARCHAR(100),
      market_cap BIGINT,
      face_value DECIMAL(10,2),
      lot_size INTEGER,
      tick_size DECIMAL(10,4),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT stock_instrument_unique UNIQUE (instrument_id)
    )
  `);

  // Create indices table for index-specific data
  // Index type is sectoral, broad market
  await client.query(`
    CREATE TABLE IF NOT EXISTS index (
      index_id SERIAL PRIMARY KEY,
      instrument_id INTEGER NOT NULL REFERENCES instrument(instrument_id),
      index_type VARCHAR(50),
      base_year INTEGER,
      base_value DECIMAL(12,4),
      constituents_count INTEGER,
      methodology TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT indices_instrument_unique UNIQUE (instrument_id)
    )
  `);

  // Create option table for option-specific data
  await client.query(`
    CREATE TABLE IF NOT EXISTS option (
      option_id SERIAL PRIMARY KEY,
      instrument_id INTEGER NOT NULL REFERENCES instrument(instrument_id),
      underlying_instrument_id INTEGER NOT NULL REFERENCES instrument(instrument_id),
      option_type VARCHAR(4) NOT NULL CHECK (option_type IN ('CALL', 'PUT')),
      strike_price DECIMAL(12,4) NOT NULL,
      expiry_date DATE NOT NULL,
      lot_size INTEGER NOT NULL,
      tick_size DECIMAL(10,4),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT option_instrument_unique UNIQUE (instrument_id)
    )
  `);

  // Create future table for future-specific data
  await client.query(`
    CREATE TABLE IF NOT EXISTS future (
      future_id SERIAL PRIMARY KEY,
      instrument_id INTEGER NOT NULL REFERENCES instrument(instrument_id),
      underlying_instrument_id INTEGER REFERENCES instrument(instrument_id),
      expiry_date DATE NOT NULL,
      lot_size INTEGER NOT NULL,
      tick_size DECIMAL(10,4),
      margin_percentage DECIMAL(5,2),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT future_instrument_unique UNIQUE (instrument_id)
    )
  `);

  // Create open interest table for tracking open interest data
  await client.query(`
    CREATE TABLE IF NOT EXISTS open_interest (
      time TIMESTAMPTZ NOT NULL,
      instrument_id INTEGER NOT NULL REFERENCES instrument(instrument_id),
      open_interest BIGINT NOT NULL,
      change_in_oi BIGINT,
      percentage_change DECIMAL(6,2),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT open_interest_pkey PRIMARY KEY (time, instrument_id)
    )
  `);

  // Create daily OHLCV table specifically for daily data
  await client.query(`
    CREATE TABLE IF NOT EXISTS daily_ohlcv (
      date DATE NOT NULL,
      instrument_id INTEGER NOT NULL REFERENCES instrument(instrument_id),
      open_price DECIMAL(12,4) NOT NULL,
      high_price DECIMAL(12,4) NOT NULL,
      low_price DECIMAL(12,4) NOT NULL,
      close_price DECIMAL(12,4) NOT NULL,
      volume BIGINT NOT NULL,
      turnover DECIMAL(20,2),
      trades_count INTEGER,
      delivery_quantity BIGINT,
      delivery_percentage DECIMAL(5,2),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT daily_ohlcv_pkey PRIMARY KEY (date, instrument_id)
    )
  `);

  // Create index constituents table to store instruments that are part of an index
  await client.query(`
    CREATE TABLE IF NOT EXISTS index_constituent (
      index_constituent_id SERIAL PRIMARY KEY,
      index_instrument_id INTEGER NOT NULL REFERENCES instrument(instrument_id),
      constituent_instrument_id INTEGER NOT NULL REFERENCES instrument(instrument_id),
      weightage DECIMAL(8,4) NOT NULL,
      shares_outstanding BIGINT,
      effective_date DATE NOT NULL,
      end_date DATE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT index_constituent_unique UNIQUE (index_instrument_id, constituent_instrument_id, effective_date),
      CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= effective_date),
      CONSTRAINT valid_weightage CHECK (weightage >= 0 AND weightage <= 100)
    )
  `);

  // Create indexes for better performance
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_stock_sector ON stock(sector);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_stock_industry ON stock(industry);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_option_underlying ON option(underlying_instrument_id);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_option_expiry ON option(expiry_date);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_futures_underlying ON future(underlying_instrument_id);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_futures_expiry ON future(expiry_date);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_open_interest_time ON open_interest(time DESC);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_daily_ohlcv_date ON daily_ohlcv(date DESC);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_daily_ohlcv_instrument_date ON daily_ohlcv(instrument_id, date DESC);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_index_constituent_index ON index_constituent(index_instrument_id);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_index_constituent_constituent ON index_constituent(constituent_instrument_id);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_index_constituent_effective_date ON index_constituent(effective_date);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_index_constituent_end_date ON index_constituent(end_date);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_index_constituent_active ON index_constituent(index_instrument_id, constituent_instrument_id) WHERE end_date IS NULL;
  `);
}

export async function down(client: PgClient): Promise<void> {
  // Drop indexes first
  await client.query("DROP INDEX IF EXISTS idx_index_constituent_active");
  await client.query("DROP INDEX IF EXISTS idx_index_constituent_end_date");
  await client.query(
    "DROP INDEX IF EXISTS idx_index_constituent_effective_date",
  );
  await client.query("DROP INDEX IF EXISTS idx_index_constituent_constituent");
  await client.query("DROP INDEX IF EXISTS idx_index_constituent_index");
  await client.query("DROP INDEX IF EXISTS idx_daily_ohlcv_instrument_date");
  await client.query("DROP INDEX IF EXISTS idx_daily_ohlcv_date");
  await client.query("DROP INDEX IF EXISTS idx_open_interest_time");
  await client.query("DROP INDEX IF EXISTS idx_futures_expiry");
  await client.query("DROP INDEX IF EXISTS idx_futures_underlying");
  await client.query("DROP INDEX IF EXISTS idx_option_expiry");
  await client.query("DROP INDEX IF EXISTS idx_option_underlying");
  await client.query("DROP INDEX IF EXISTS idx_stock_industry");
  await client.query("DROP INDEX IF EXISTS idx_stock_sector");

  // Drop tables in reverse order
  await client.query("DROP TABLE IF EXISTS index_constituent");
  await client.query("DROP TABLE IF EXISTS daily_ohlcv");
  await client.query("DROP TABLE IF EXISTS open_interest");
  await client.query("DROP TABLE IF EXISTS future");
  await client.query("DROP TABLE IF EXISTS option");
  await client.query("DROP TABLE IF EXISTS index");
  await client.query("DROP TABLE IF EXISTS stock");
}
