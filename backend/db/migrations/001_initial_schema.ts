import type { PgClient } from "../../src/lib/database";

export const version = "1.0.0";
export const description = "Initial schema setup for tradebot";

export async function up(client: PgClient): Promise<void> {
  // Add enum for instrument type
  await client.query(`
    CREATE TYPE instrument_type AS ENUM (
      'STOCK',
      'INDEX',
      'FUTURE',
      'OPTION'
    );

    CREATE TYPE exchange AS ENUM (
      'NSE', 'BSE'
    );
  `);

  // Create instrument table
  await client.query(`
    CREATE TABLE IF NOT EXISTS instrument (
      instrument_id INTEGER PRIMARY KEY,
      symbol VARCHAR(50) NOT NULL UNIQUE,
      exchange exchange NOT NULL,
      instrument_type instrument_type NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      listing_date DATE,
      delisting_date DATE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Create tick data table (will be converted to hypertable in later migration)
  await client.query(`
    CREATE TABLE IF NOT EXISTS tick_data (
      time TIMESTAMPTZ NOT NULL,
      instrument_id INTEGER NOT NULL REFERENCES instrument(instrument_id),
      data JSONB NOT NULL,
      CONSTRAINT tick_data_pkey PRIMARY KEY (time, instrument_id)
    )
  `);

  // Create OHLCV candle table (will be converted to hypertable in later migration)
  await client.query(`
    CREATE TABLE IF NOT EXISTS ohlcv_candle (
      time TIMESTAMPTZ NOT NULL,
      instrument_id INTEGER NOT NULL REFERENCES instrument(instrument_id),
      timeframe VARCHAR(10) NOT NULL,
      open_price DECIMAL(12,4) NOT NULL,
      high_price DECIMAL(12,4) NOT NULL,
      low_price DECIMAL(12,4) NOT NULL,
      close_price DECIMAL(12,4) NOT NULL,
      volume BIGINT NOT NULL,

      CONSTRAINT pk_instrument_time_timeframe PRIMARY KEY (time, instrument_id, timeframe)
    )
  `);

  // Create order book snapshot table (will be converted to hypertable in later migration)
  await client.query(`
    CREATE TABLE IF NOT EXISTS order_book_snapshot (
      time TIMESTAMPTZ NOT NULL,
      instrument_id INTEGER NOT NULL REFERENCES instrument(instrument_id),
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
  await client.query("DROP TABLE IF EXISTS order_book_snapshot");
  await client.query("DROP TABLE IF EXISTS ohlcv_candle");
  await client.query("DROP TABLE IF EXISTS tick_data");
  await client.query("DROP TABLE IF EXISTS instrument");
  await client.query("DROP TYPE IF EXISTS instrument_type");
  await client.query("DROP TYPE IF EXISTS exchange");
}
