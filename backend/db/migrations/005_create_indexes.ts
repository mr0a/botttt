import type { PgClient } from "../../src/lib/database";

export const version = "5.0.0";
export const description = "Create indexes for existing tables";

export async function up(client: PgClient): Promise<void> {
  // Create indexes for instruments table
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_instruments_symbol ON instruments(symbol)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_instruments_active ON instruments(is_active)
  `);

  // Create indexes for tick_data table
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_tick_data_instrument_time ON tick_data (instrument_id, time DESC)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_tick_data_price ON tick_data (price)
  `);

  // Create indexes for ohlc_candles table
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_ohlc_instrument_timeframe ON ohlc_candles (instrument_id, timeframe, time DESC)
  `);

  // Create indexes for orders table
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_orders_strategy ON orders(strategy_id)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_orders_current_status ON orders(current_status)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)
  `);

  // Create indexes for order_history table
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(order_id)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_order_history_timestamp ON order_history(timestamp DESC)
  `);

  // Create indexes for positions table
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_positions_strategy ON positions(strategy_id)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status)
  `);

  // Create indexes for strategies table
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_strategies_enabled ON strategies(is_enabled)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_strategies_mode ON strategies(execution_mode)
  `);

  // Create unique index for open positions (business rule: one open position per strategy-instrument pair)
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_positions_strategy_instrument 
    ON positions(strategy_id, instrument_id) 
    WHERE status = 'OPEN'
  `);
}

export async function down(client: PgClient): Promise<void> {
  // Drop all indexes
  await client.query("DROP INDEX IF EXISTS idx_positions_strategy_instrument");
  await client.query("DROP INDEX IF EXISTS idx_strategies_mode");
  await client.query("DROP INDEX IF EXISTS idx_strategies_enabled");
  await client.query("DROP INDEX IF EXISTS idx_positions_status");
  await client.query("DROP INDEX IF EXISTS idx_positions_strategy");
  await client.query("DROP INDEX IF EXISTS idx_order_history_timestamp");
  await client.query("DROP INDEX IF EXISTS idx_order_history_order_id");
  await client.query("DROP INDEX IF EXISTS idx_orders_created_at");
  await client.query("DROP INDEX IF EXISTS idx_orders_current_status");
  await client.query("DROP INDEX IF EXISTS idx_orders_strategy");
  await client.query("DROP INDEX IF EXISTS idx_ohlc_instrument_timeframe");
  await client.query("DROP INDEX IF EXISTS idx_tick_data_price");
  await client.query("DROP INDEX IF EXISTS idx_tick_data_instrument_time");
  await client.query("DROP INDEX IF EXISTS idx_instruments_active");
  await client.query("DROP INDEX IF EXISTS idx_instruments_symbol");
}
