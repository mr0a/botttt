#!/usr/bin/env bun
import { Database, type PgClient } from "../src/lib/database";
import { logger } from "../src/lib/logger";
import * as path from "path";
import * as fs from "fs";

interface Migration {
  up: (client: PgClient) => Promise<void>;
  down: (client: PgClient) => Promise<void>;
}

interface MigrationRecord {
  version: string;
  description: string;
  executed_at: Date;
}

export class MigrationRunner {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  async init(): Promise<void> {
    await this.db.connect();

    // Ensure schema_migrations table exists (should already be created by init.sql)
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(50) PRIMARY KEY,
        description TEXT,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  }

  async getAppliedMigrations(): Promise<string[]> {
    const result = await this.db.query<MigrationRecord>(
      "SELECT version FROM schema_migrations ORDER BY executed_at ASC",
    );
    return result.rows.map((row) => row.version);
  }

  async getPendingMigrations(): Promise<string[]> {
    const migrationsDir = path.join(__dirname, "migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".ts") && !file.includes("README"))
      .sort();

    const applied = await this.getAppliedMigrations();
    return files.filter((file) => !applied.includes(file));
  }

  isMigration(obj: unknown): obj is Migration {
    return (
      typeof obj === "object" &&
      obj !== null &&
      typeof (obj as Migration).up === "function" &&
      typeof (obj as Migration).down === "function"
    );
  }

  async runMigration(
    fileName: string,
    direction: "up" | "down",
  ): Promise<void> {
    const migrationPath = path.join(__dirname, "migrations", fileName);
    const module = (await import(migrationPath)) as unknown;
    if (!this.isMigration(module)) {
      throw new Error("Invalid migration module");
    }
    const migration = module;

    // Extract description from filename
    const description = this.getDescriptionFromFilename(fileName);

    logger.info(`Running ${direction} migration: ${fileName}`);

    await this.db.transaction(async (client) => {
      if (direction === "up") {
        await migration.up(client);
        await client.query(
          "INSERT INTO schema_migrations (version, description) VALUES ($1, $2)",
          [fileName, description],
        );
      } else {
        await migration.down(client);
        await client.query("DELETE FROM schema_migrations WHERE version = $1", [
          fileName,
        ]);
      }
    });

    logger.info(`Completed ${direction} migration: ${fileName}`);
  }

  private getDescriptionFromFilename(fileName: string): string {
    // Convert "001_create_initial_schema.ts" to "Create initial schema"
    const baseName = fileName.replace(".ts", "");
    const parts = baseName.split("_");
    if (parts.length > 1) {
      // Remove the number prefix and join the rest
      const descriptionParts = parts.slice(1);
      return descriptionParts
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    }
    return baseName;
  }

  async migrate(): Promise<void> {
    await this.init();

    const pending = await this.getPendingMigrations();

    if (pending.length === 0) {
      logger.info("No pending migrations");
      return;
    }

    logger.info(`Found ${pending.length} pending migrations`);

    for (const fileName of pending) {
      await this.runMigration(fileName, "up");
    }

    logger.info("All migrations completed");
  }

  async rollback(steps: number = 1): Promise<void> {
    await this.init();

    const applied = await this.getAppliedMigrations();
    const toRollback = applied.slice(-steps).reverse();

    if (toRollback.length === 0) {
      logger.info("No migrations to rollback");
      return;
    }

    logger.info(`Rolling back ${toRollback.length} migrations`);

    for (const fileName of toRollback) {
      await this.runMigration(fileName, "down");
    }

    logger.info("Rollback completed");
  }

  async reset(): Promise<void> {
    await this.db.transaction(async (client) => {
      await client.query("DROP SCHEMA IF EXISTS tradebot CASCADE");

      await client.query("CREATE EXTENSION IF NOT EXISTS timescaledb;");
      await client.query("CREATE SCHEMA IF NOT EXISTS tradebot");
      await client.query("SET search_path TO tradebot");
      logger.info("Database reset completed");
    });
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}

async function main() {
  const db = new Database();
  const runner = new MigrationRunner(db);

  try {
    const command = process.argv[2] ?? "migrate";

    switch (command) {
      case "migrate":
        await runner.migrate();
        break;
      case "rollback": {
        const steps = parseInt(process.argv[3] ?? "1");
        await runner.rollback(steps);
        break;
      }
      case "status": {
        await runner.init();
        const pending = await runner.getPendingMigrations();
        const applied = await runner.getAppliedMigrations();

        if (applied.length > 0) {
          logger.info("Applied migrations:");
          applied.forEach((fileName) => logger.info(`  ✓ ${fileName}`));
        } else {
          logger.info("No applied migrations");
        }

        if (pending.length > 0) {
          logger.warn("Pending migrations:");
          pending.forEach((fileName) => logger.info(`  ○ ${fileName}`));
        } else {
          logger.info("No pending migrations");
        }

        break;
      }
      case "reset": {
        await runner.reset();
        break;
      }
      default:
        logger.error(
          "Usage: bun migrate.ts [migrate|rollback|status|reset] [steps]",
        );
        process.exit(1);
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error, `Migration failed: ${error.message}`);
    } else {
      logger.error(error, "Migration failed");
    }
    process.exit(1);
  } finally {
    await runner.close();
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error(error, "Migration failed");
    process.exit(1);
  });
}
