import type { PgClient } from "../../src/lib/database";

export const version = "4.0.0";
export const description = "Create broker credentials table";

export async function up(client: PgClient): Promise<void> {
  // Create broker credentials table
  await client.query(`
    CREATE TABLE IF NOT EXISTS broker_credentials (
      id SERIAL PRIMARY KEY,
      broker_name VARCHAR(50) NOT NULL,
      encrypted_api_key BYTEA NOT NULL,
      encrypted_secret BYTEA NOT NULL,
      encryption_key_id VARCHAR(50) NOT NULL,
      config JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function down(client: PgClient): Promise<void> {
  // Drop table
  await client.query("DROP TABLE IF EXISTS broker_credentials");
}
