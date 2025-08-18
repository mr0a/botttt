import type { PgClient } from "../../src/lib/database";

export const version = "7.0.0";
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
        AND hypertable_name = 'ohlc_candles'
      ) THEN
        PERFORM add_retention_policy('ohlc_candles', INTERVAL '2 years');
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
        AND hypertable_name = 'order_book_snapshots'
      ) THEN
        PERFORM add_retention_policy('order_book_snapshots', INTERVAL '7 days');
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

      -- Remove ohlc_candles retention policy
      SELECT job_id INTO job_id FROM timescaledb_information.jobs 
      WHERE proc_name = 'policy_retention' AND hypertable_name = 'ohlc_candles';
      IF job_id IS NOT NULL THEN
        PERFORM remove_retention_policy('ohlc_candles');
      END IF;

      -- Remove order_book_snapshots retention policy
      SELECT job_id INTO job_id FROM timescaledb_information.jobs 
      WHERE proc_name = 'policy_retention' AND hypertable_name = 'order_book_snapshots';
      IF job_id IS NOT NULL THEN
        PERFORM remove_retention_policy('order_book_snapshots');
      END IF;
    END $$
  `);
}
