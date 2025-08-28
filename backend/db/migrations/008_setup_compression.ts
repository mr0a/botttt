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

  // Enable compression on ohlcv_candle hypertable
  await client.query(`
    ALTER TABLE ohlcv_candle SET (
      timescaledb.compress,
      timescaledb.compress_orderby = 'time DESC',
      timescaledb.compress_segmentby = 'instrument_id, timeframe'
    )
  `);

  // Enable compression on order_book_snapshot hypertable
  await client.query(`
    ALTER TABLE order_book_snapshot SET (
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
        AND hypertable_name = 'ohlcv_candle'
      ) THEN
        PERFORM add_compression_policy('ohlcv_candle', INTERVAL '30 days');
      END IF;
    END $$
  `);

  // Set up compression policy for order_book_snapshot (compress after 1 day)
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.jobs
        WHERE proc_name = 'policy_compression'
        AND hypertable_name = 'order_book_snapshot'
      ) THEN
        PERFORM add_compression_policy('order_book_snapshot', INTERVAL '1 day');
      END IF;
    END $$
  `);

  // Enable compression on open_interest hypertable
  await client.query(`
    ALTER TABLE open_interest SET (
      timescaledb.compress,
      timescaledb.compress_orderby = 'time DESC',
      timescaledb.compress_segmentby = 'instrument_id'
    )
  `);

  // Set up compression policy for open_interest (compress after 7 days)
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.jobs
        WHERE proc_name = 'policy_compression'
        AND hypertable_name = 'open_interest'
      ) THEN
        PERFORM add_compression_policy('open_interest', INTERVAL '7 days');
      END IF;
    END $$
  `);

  // Enable compression on daily_ohlcv hypertable
  await client.query(`
    ALTER TABLE daily_ohlcv SET (
      timescaledb.compress,
      timescaledb.compress_orderby = 'date DESC',
      timescaledb.compress_segmentby = 'instrument_id'
    )
  `);

  // Set up compression policy for daily_ohlcv (compress after 90 days)
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.jobs
        WHERE proc_name = 'policy_compression'
        AND hypertable_name = 'daily_ohlcv'
      ) THEN
        PERFORM add_compression_policy('daily_ohlcv', INTERVAL '90 days');
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

      -- Remove ohlcv_candle compression policy
      SELECT job_id INTO job_id FROM timescaledb_information.jobs 
      WHERE proc_name = 'policy_compression' AND hypertable_name = 'ohlcv_candle';
      IF job_id IS NOT NULL THEN
        PERFORM remove_compression_policy('ohlcv_candle');
      END IF;

      -- Remove order_book_snapshots compression policy
      SELECT job_id INTO job_id FROM timescaledb_information.jobs
      WHERE proc_name = 'policy_compression' AND hypertable_name = 'order_book_snapshot';
      IF job_id IS NOT NULL THEN
        PERFORM remove_compression_policy('order_book_snapshot');
      END IF;

      -- Remove open_interest compression policy
      SELECT job_id INTO job_id FROM timescaledb_information.jobs
      WHERE proc_name = 'policy_compression' AND hypertable_name = 'open_interest';
      IF job_id IS NOT NULL THEN
        PERFORM remove_compression_policy('open_interest');
      END IF;

      -- Remove daily_ohlcv compression policy
      SELECT job_id INTO job_id FROM timescaledb_information.jobs
      WHERE proc_name = 'policy_compression' AND hypertable_name = 'daily_ohlcv';
      IF job_id IS NOT NULL THEN
        PERFORM remove_compression_policy('daily_ohlcv');
      END IF;
    END $$
  `);

  // Disable compression on hypertables
  await client.query(`
    ALTER TABLE tick_data SET (timescaledb.compress = false)
  `);

  await client.query(`
    ALTER TABLE ohlcv_candle SET (timescaledb.compress = false)
  `);

  await client.query(`
    ALTER TABLE order_book_snapshot SET (timescaledb.compress = false)
  `);

  await client.query(`
    ALTER TABLE open_interest SET (timescaledb.compress = false)
  `);

  await client.query(`
    ALTER TABLE daily_ohlcv SET (timescaledb.compress = false)
  `);
}
