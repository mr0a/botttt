import type { PgClient } from "../../src/lib/database";

export const version = "5.0.0";
export const description = "Create positions and strategies tables";

export async function up(client: PgClient): Promise<void> {
  // Create strategy table
  await client.query(`
    CREATE TABLE IF NOT EXISTS strategy (
      strategy_id VARCHAR(100) PRIMARY KEY,
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

  // Create position table
  await client.query(`
    CREATE TABLE IF NOT EXISTS position (
      position_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      strategy_id VARCHAR(100) NOT NULL REFERENCES strategy(strategy_id),
      instrument_id INTEGER NOT NULL REFERENCES instrument(instrument_id),
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
}

export async function down(client: PgClient): Promise<void> {
  // Drop tables in reverse order (position first due to foreign key dependency)
  await client.query("DROP TABLE IF EXISTS position");
  await client.query("DROP TABLE IF EXISTS strategy");
}
