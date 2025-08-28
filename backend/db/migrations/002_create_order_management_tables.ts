import type { PgClient } from "../../src/lib/database";

export const version = "2.0.0";
export const description = "Create order management tables";

export async function up(client: PgClient): Promise<void> {
  // Create transaction type
  await client.query(`
    CREATE TYPE transaction_type AS ENUM (
      'BUY',
      'SELL'
    );
  `);

  // Create order table
  await client.query(`
    CREATE TABLE IF NOT EXISTS instrument_order (
      order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      strategy_id VARCHAR(100) NOT NULL,
      instrument_id INTEGER NOT NULL REFERENCES instrument(instrument_id),
      transaction_type transaction_type NOT NULL,
      quantity INTEGER NOT NULL,
      price DECIMAL(12,4),
      order_kind VARCHAR(20) NOT NULL,
      current_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
      broker_order_id VARCHAR(100),
      filled_quantity INTEGER DEFAULT 0,
      average_price DECIMAL(12,4),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      executed_at TIMESTAMPTZ,
      cancelled_at TIMESTAMPTZ
    )
  `);

  // Create order history table
  await client.query(`
    CREATE TABLE IF NOT EXISTS order_history (
      order_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES instrument_order(order_id),
      status VARCHAR(20) NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      details JSONB
    )
  `);
}

export async function down(client: PgClient): Promise<void> {
  // Drop tables in reverse order
  await client.query("DROP TABLE IF EXISTS order_history");
  await client.query("DROP TABLE IF EXISTS instrument_order");
  await client.query("DROP TYPE IF EXISTS transaction_type");
}
