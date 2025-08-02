import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { Database } from "../lib/database.js";
import { MigrationRunner } from "../../db/migrate.js";

describe("Database", () => {
  let db: Database;
  let migrator: MigrationRunner;

  beforeEach(async () => {
    db = new Database();
    await db.connect();
    migrator = new MigrationRunner(db);
  });

  afterEach(async () => {
    await db.close();
  });

  test("should connect successfully", async () => {
    const health = await db.healthCheck();
    expect(health.status).toBe("healthy");
    expect(health.details.connected).toBe(true);
  });

  test("should run migrations successfully", async () => {
    const migrationFileName = "001_initial_schema.ts";
    await migrator.runMigration(migrationFileName, "up");

    // Check if tables were created
    const marketsResult = await db.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='markets'",
    );
    expect(marketsResult.rowCount).toBe(1);

    const marketDataResult = await db.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='market_data'",
    );
    expect(marketDataResult.rowCount).toBe(1);

    // Check if sample data was inserted
    const markets = await db.query("SELECT * FROM markets");
    expect(markets.rowCount).toBeGreaterThan(0);
  });

  test("should handle basic queries", async () => {
    const migrationFileName = "001_initial_schema.ts";
    await migrator.runMigration(migrationFileName, "up");

    const result = await db.query("SELECT * FROM markets WHERE symbol = ?", [
      "BTCUSDT",
    ]);
    expect(result.rowCount).toBe(1);

    const market = result.rows[0] as { symbol: string };
    expect(market.symbol).toBe("BTCUSDT");
  });
});
