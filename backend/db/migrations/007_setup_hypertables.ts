import type { PgClient } from "../../src/lib/database";

export const version = "7.0.0";
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
        WHERE hypertable_name = 'ohlcv_candle'
      ) THEN
        PERFORM create_hypertable('ohlcv_candle', 'time', chunk_time_interval => INTERVAL '1 day');
      END IF;
    END $$
  `);

  // Convert order_book_snapshots to hypertable if not already done
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_name = 'order_book_snapshot'
      ) THEN
        PERFORM create_hypertable('order_book_snapshot', 'time', chunk_time_interval => INTERVAL '1 hour');
      END IF;
    END $$
  `);

  // Convert open_interest to hypertable if not already done
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_name = 'open_interest'
      ) THEN
        PERFORM create_hypertable('open_interest', 'time', chunk_time_interval => INTERVAL '1 day');
      END IF;
    END $$
  `);

  // Convert daily_ohlcv to hypertable if not already done
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables
        WHERE hypertable_name = 'daily_ohlcv'
      ) THEN
        PERFORM create_hypertable('daily_ohlcv', 'date', chunk_time_interval => INTERVAL '1 year');
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
