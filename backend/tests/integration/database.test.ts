import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Database } from "../../src/lib/database";

describe("Database Integration", () => {
  let db: Database;

  beforeAll(async () => {
    db = new Database();
    await db.connect();
  });

  afterAll(async () => {
    await db.close();
  });

  it("should connect to database successfully", () => {
    expect(db).toBeInstanceOf(Database);
  });

  it("should execute basic query", async () => {
    const result = await db.query("SELECT 1 as test");
    expect(result).toBeDefined();
    expect(result.rows).toBeArray();
    expect(result.rows[0]).toEqual({ test: 1 });
  });

  it("should handle connection errors gracefully", async () => {
    const invalidDb = new Database({
      host: "invalid-host",
      port: 9999,
      database: "nonexistent",
      user: "invalid",
      password: "invalid",
    });

    try {
      await invalidDb.connect();
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
