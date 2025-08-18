import type { PgClient } from "../../src/lib/database";

export const version = "3.0.0";
export const description = "Create positions and strategies tables";

export async function up(client: PgClient): Promise<void> {
  // Create positions table
  await client.query(`
    CREATE TABLE IF NOT EXISTS positions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      strategy_id VARCHAR(100) NOT NULL,
      instrument_id INTEGER NOT NULL REFERENCES instruments(id),
      quantity INTEGER NOT NULL,
      average_entry_price DECIMAL(12,4) NOT NULL,
      current_price DECIMAL(12,4),
      unrealized_pnl DECIMAL(12,2),
      realized_pnl DECIMAL(12,2) DEFAULT 0,
      stop_loss_price DECIMAL(12,4),
      target_price DECIMAL(12,4),
      status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
      opened_at TIMESTAMPTZ DEFAULT NOW(),
      closed_at TIMESTAMPTZ
    )
  `);

  // Create strategies table
  await client.query(`
    CREATE TABLE IF NOT EXISTS strategies (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      class_name VARCHAR(100) NOT NULL,
      config JSONB NOT NULL,
      is_enabled BOOLEAN DEFAULT FALSE,
      execution_mode VARCHAR(20) DEFAULT 'PAPER',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function down(client: PgClient): Promise<void> {
  // Drop tables in reverse order
  await client.query("DROP TABLE IF EXISTS strategies");
  await client.query("DROP TABLE IF EXISTS positions");
}
