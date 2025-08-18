import type { PgClient } from "../../src/lib/database";

export const version = "1.0.0";
export const description = "Initial schema setup for tradebot";

export async function up(client: PgClient): Promise<void> {
  // Create instruments table
  await client.query(`
    CREATE TABLE IF NOT EXISTS instruments (
      id SERIAL PRIMARY KEY,
      symbol VARCHAR(50) NOT NULL UNIQUE,
      exchange VARCHAR(20) NOT NULL,
      instrument_type VARCHAR(20) NOT NULL,
      tick_size DECIMAL(10,4),
      lot_size INTEGER,
      expiry_date DATE,
      strike_price DECIMAL(10,2),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Create tick data table (will be converted to hypertable in later migration)
  await client.query(`
    CREATE TABLE IF NOT EXISTS tick_data (
      time TIMESTAMPTZ NOT NULL,
      instrument_id INTEGER NOT NULL REFERENCES instruments(id),
      price DECIMAL(12,4) NOT NULL,
      quantity INTEGER NOT NULL,
      trade_id VARCHAR(50),
      exchange VARCHAR(20) NOT NULL,
      CONSTRAINT tick_data_pkey PRIMARY KEY (time, instrument_id)
    )
  `);

  // Create OHLC candles table (will be converted to hypertable in later migration)
  await client.query(`
    CREATE TABLE IF NOT EXISTS ohlc_candles (
      time TIMESTAMPTZ NOT NULL,
      instrument_id INTEGER NOT NULL REFERENCES instruments(id),
      timeframe VARCHAR(10) NOT NULL,
      open_price DECIMAL(12,4) NOT NULL,
      high_price DECIMAL(12,4) NOT NULL,
      low_price DECIMAL(12,4) NOT NULL,
      close_price DECIMAL(12,4) NOT NULL,
      volume BIGINT NOT NULL,
      trade_count INTEGER,
      vwap DECIMAL(12,4),
      CONSTRAINT ohlc_candles_pkey PRIMARY KEY (time, instrument_id, timeframe)
    )
  `);

  // Create order book snapshots table (will be converted to hypertable in later migration)
  await client.query(`
    CREATE TABLE IF NOT EXISTS order_book_snapshots (
      time TIMESTAMPTZ NOT NULL,
      instrument_id INTEGER NOT NULL REFERENCES instruments(id),
      bid_prices DECIMAL(12,4)[] NOT NULL,
      bid_quantities INTEGER[] NOT NULL,
      ask_prices DECIMAL(12,4)[] NOT NULL,
      ask_quantities INTEGER[] NOT NULL,
      total_bid_quantity BIGINT,
      total_ask_quantity BIGINT,
      CONSTRAINT order_book_pkey PRIMARY KEY (time, instrument_id)
    )
  `);
}

export async function down(client: PgClient): Promise<void> {
  // Drop tables in reverse order
  await client.query("DROP TABLE IF EXISTS order_book_snapshots");
  await client.query("DROP TABLE IF EXISTS ohlc_candles");
  await client.query("DROP TABLE IF EXISTS tick_data");
  await client.query("DROP TABLE IF EXISTS instruments");
}
