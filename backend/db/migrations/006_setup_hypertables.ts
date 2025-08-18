import type { PgClient } from "../../src/lib/database";

export const version = "6.0.0";
export const description = "Setup TimescaleDB hypertables";

export async function up(client: PgClient): Promise<void> {
  // Convert tick_data to hypertable if not already done
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables 
        WHERE hypertable_name = 'tick_data'
      ) THEN
        PERFORM create_hypertable('tick_data', 'time', chunk_time_interval => INTERVAL '1 hour');
      END IF;
    END $$
  `);

  // Convert ohlc_candles to hypertable if not already done
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables 
        WHERE hypertable_name = 'ohlc_candles'
      ) THEN
        PERFORM create_hypertable('ohlc_candles', 'time', chunk_time_interval => INTERVAL '1 day');
      END IF;
    END $$
  `);

  // Convert order_book_snapshots to hypertable if not already done
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables 
        WHERE hypertable_name = 'order_book_snapshots'
      ) THEN
        PERFORM create_hypertable('order_book_snapshots', 'time', chunk_time_interval => INTERVAL '1 hour');
      END IF;
    END $$
  `);
}

export async function down(client: PgClient): Promise<void> {
  // Note: Converting back from hypertables to regular tables is complex and potentially destructive
  // In practice, this would require recreating tables and migrating data
  // For now, we'll just log the reversal attempt

  await client.query(`
    -- WARNING: Hypertable conversion reversal not implemented
    -- This would require complex data migration procedures
    SELECT 1 -- placeholder
  `);
}
