import type { PgClient } from "../../src/lib/database";

export const version = "9.0.0";
export const description = "Setup retention policies for hypertables";

export async function up(client: PgClient): Promise<void> {
  // Set up retention policy for tick_data (30 days)
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.jobs 
        WHERE proc_name = 'policy_retention' 
        AND hypertable_name = 'tick_data'
      ) THEN
        PERFORM add_retention_policy('tick_data', INTERVAL '30 days');
      END IF;
    END $$
  `);

  // Set up retention policy for ohlc_candles (2 years)
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.jobs 
        WHERE proc_name = 'policy_retention' 
        AND hypertable_name = 'ohlcv_candle'
      ) THEN
        PERFORM add_retention_policy('ohlcv_candle', INTERVAL '2 years');
      END IF;
    END $$
  `);

  // Set up retention policy for order_book_snapshots (7 days)
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.jobs
        WHERE proc_name = 'policy_retention'
        AND hypertable_name = 'order_book_snapshot'
      ) THEN
        PERFORM add_retention_policy('order_book_snapshot', INTERVAL '7 days');
      END IF;
    END $$
  `);

  // Set up retention policy for open_interest (1 year)
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.jobs
        WHERE proc_name = 'policy_retention'
        AND hypertable_name = 'open_interest'
      ) THEN
        PERFORM add_retention_policy('open_interest', INTERVAL '1 year');
      END IF;
    END $$
  `);

  // Set up retention policy for daily_ohlcv (5 years)
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.jobs
        WHERE proc_name = 'policy_retention'
        AND hypertable_name = 'daily_ohlcv'
      ) THEN
        PERFORM add_retention_policy('daily_ohlcv', INTERVAL '5 years');
      END IF;
    END $$
  `);
}

export async function down(client: PgClient): Promise<void> {
  // Remove retention policies
  await client.query(`
    DO $$
    DECLARE
      job_id INTEGER;
    BEGIN
      -- Remove tick_data retention policy
      SELECT job_id INTO job_id FROM timescaledb_information.jobs 
      WHERE proc_name = 'policy_retention' AND hypertable_name = 'tick_data';
      IF job_id IS NOT NULL THEN
        PERFORM remove_retention_policy('tick_data');
      END IF;

      -- Remove ohlcv_candle retention policy
      SELECT job_id INTO job_id FROM timescaledb_information.jobs 
      WHERE proc_name = 'policy_retention' AND hypertable_name = 'ohlcv_candle';
      IF job_id IS NOT NULL THEN
        PERFORM remove_retention_policy('ohlcv_candle');
      END IF;

      -- Remove order_book_snapshot retention policy
      SELECT job_id INTO job_id FROM timescaledb_information.jobs
      WHERE proc_name = 'policy_retention' AND hypertable_name = 'order_book_snapshot';
      IF job_id IS NOT NULL THEN
        PERFORM remove_retention_policy('order_book_snapshot');
      END IF;

      -- Remove open_interest retention policy
      SELECT job_id INTO job_id FROM timescaledb_information.jobs
      WHERE proc_name = 'policy_retention' AND hypertable_name = 'open_interest';
      IF job_id IS NOT NULL THEN
        PERFORM remove_retention_policy('open_interest');
      END IF;

      -- Remove daily_ohlcv retention policy
      SELECT job_id INTO job_id FROM timescaledb_information.jobs
      WHERE proc_name = 'policy_retention' AND hypertable_name = 'daily_ohlcv';
      IF job_id IS NOT NULL THEN
        PERFORM remove_retention_policy('daily_ohlcv');
      END IF;
    END $$
  `);
}
