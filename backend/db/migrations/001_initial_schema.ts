import type { PgClient } from '../../src/lib/database';

export async function up(client: PgClient): Promise<void> {
  // Create markets table
  await client.query(`
    CREATE TABLE IF NOT EXISTS markets (
      id SERIAL PRIMARY KEY,
      symbol VARCHAR(20) NOT NULL UNIQUE,
      base_asset VARCHAR(10) NOT NULL,
      quote_asset VARCHAR(10) NOT NULL,
      exchange VARCHAR(50) NOT NULL,
      market_type VARCHAR(20) NOT NULL DEFAULT 'spot',
      min_order_size DECIMAL(20, 8) NOT NULL DEFAULT 0.00000001,
      max_order_size DECIMAL(20, 8) NOT NULL DEFAULT 1000000,
      tick_size DECIMAL(20, 8) NOT NULL DEFAULT 0.00000001,
      step_size DECIMAL(20, 8) NOT NULL DEFAULT 0.00000001,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Create market_data hypertable for time-series data
  await client.query(`
    CREATE TABLE IF NOT EXISTS market_data (
      id SERIAL,
      market_id INTEGER NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
      timestamp TIMESTAMPTZ NOT NULL,
      open DECIMAL(20, 8) NOT NULL,
      high DECIMAL(20, 8) NOT NULL,
      low DECIMAL(20, 8) NOT NULL,
      close DECIMAL(20, 8) NOT NULL,
      volume DECIMAL(20, 8) NOT NULL,
      quote_volume DECIMAL(20, 8) NOT NULL,
      bid DECIMAL(20, 8),
      ask DECIMAL(20, 8),
      bid_volume DECIMAL(20, 8),
      ask_volume DECIMAL(20, 8),
      trades INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Convert market_data to hypertable for time-series optimization
  await client.query(`
    SELECT create_hypertable('market_data', 'timestamp', if_not_exists => true)
  `);

  // Create indexes for performance
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_market_data_market_timestamp 
    ON market_data (market_id, timestamp DESC)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_market_data_timestamp 
    ON market_data (timestamp DESC)
  `);

  // Create updated_at trigger for markets table
  await client.query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql'
  `);

  await client.query(`
    CREATE OR REPLACE TRIGGER update_markets_updated_at
    BEFORE UPDATE ON markets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column()
  `);
}

export async function down(client: PgClient): Promise<void> {
  // Drop tables in reverse order
  await client.query('DROP TABLE IF EXISTS market_data');
  await client.query('DROP TABLE IF EXISTS markets');

  // Clean up trigger function
  await client.query('DROP FUNCTION IF EXISTS update_updated_at_column()');
}
