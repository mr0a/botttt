import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "./schema";
import { logger } from "../logger";

// Database configuration
const connectionString =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/tradebot";

// Create postgres client
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle instance
export const db = drizzle(client, { schema, logger: true });

// Export the client for direct access if needed
export { client };

// Type for the database instance
export type Database = typeof db;

// Helper function to close the connection
export async function closeDatabase() {
  try {
    await client.end();
    logger.info("Database connection closed");
  } catch (error) {
    logger.error(error, "Error closing database connection");
  }
}

// Health check function
export async function healthCheck() {
  try {
    const result = await db.execute(sql`SELECT 1 as health`);
    return { healthy: true, result };
  } catch (error) {
    logger.error(error, "Database health check failed");
    return { healthy: false, error };
  }
}
