import type { PgClient } from "../../src/lib/database";

export const version = "8.0.0";
export const description = "Setup compression for hypertables";

export async function up(client: PgClient): Promise<void> {
  // Enable compression on tick_data hypertable
  await client.query(`
    ALTER TABLE tick_data SET (
      timescaledb.compress,
      timescaledb.compress_orderby = 'time DESC',
      timescaledb.compress_segmentby = 'instrument_id'
    )
  `);

  // Enable compression on ohlc_candles hypertable
  await client.query(`
    ALTER TABLE ohlc_candles SET (
      timescaledb.compress,
      timescaledb.compress_orderby = 'time DESC',
      timescaledb.compress_segmentby = 'instrument_id, timeframe'
    )
  `);

  // Enable compression on order_book_snapshots hypertable
  await client.query(`
    ALTER TABLE order_book_snapshots SET (
      timescaledb.compress,
      timescaledb.compress_orderby = 'time DESC',
      timescaledb.compress_segmentby = 'instrument_id'
    )
  `);

  // Set up compression policy for tick_data (compress after 7 days)
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.jobs
        WHERE proc_name = 'policy_compression'
        AND hypertable_name = 'tick_data'
      ) THEN
        PERFORM add_compression_policy('tick_data', INTERVAL '7 days');
      END IF;
    END $$
  `);

  // Set up compression policy for ohlc_candles (compress after 30 days)
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.jobs
        WHERE proc_name = 'policy_compression'
        AND hypertable_name = 'ohlc_candles'
      ) THEN
        PERFORM add_compression_policy('ohlc_candles', INTERVAL '30 days');
      END IF;
    END $$
  `);

  // Set up compression policy for order_book_snapshots (compress after 1 day)
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.jobs
        WHERE proc_name = 'policy_compression'
        AND hypertable_name = 'order_book_snapshots'
      ) THEN
        PERFORM add_compression_policy('order_book_snapshots', INTERVAL '1 day');
      END IF;
    END $$
  `);
}

export async function down(client: PgClient): Promise<void> {
  // Remove compression policies
  await client.query(`
    DO $$
    DECLARE
      job_id INTEGER;
    BEGIN
      -- Remove tick_data compression policy
      SELECT job_id INTO job_id FROM timescaledb_information.jobs 
      WHERE proc_name = 'policy_compression' AND hypertable_name = 'tick_data';
      IF job_id IS NOT NULL THEN
        PERFORM remove_compression_policy('tick_data');
      END IF;

      -- Remove ohlc_candles compression policy
      SELECT job_id INTO job_id FROM timescaledb_information.jobs 
      WHERE proc_name = 'policy_compression' AND hypertable_name = 'ohlc_candles';
      IF job_id IS NOT NULL THEN
        PERFORM remove_compression_policy('ohlc_candles');
      END IF;

      -- Remove order_book_snapshots compression policy
      SELECT job_id INTO job_id FROM timescaledb_information.jobs 
      WHERE proc_name = 'policy_compression' AND hypertable_name = 'order_book_snapshots';
      IF job_id IS NOT NULL THEN
        PERFORM remove_compression_policy('order_book_snapshots');
      END IF;
    END $$
  `);

  // Disable compression on hypertables
  await client.query(`
    ALTER TABLE tick_data SET (timescaledb.compress = false)
  `);

  await client.query(`
    ALTER TABLE ohlc_candles SET (timescaledb.compress = false)
  `);

  await client.query(`
    ALTER TABLE order_book_snapshots SET (timescaledb.compress = false)
  `);
}
