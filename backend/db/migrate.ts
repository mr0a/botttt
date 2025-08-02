#!/usr/bin/env bun
import { Database, type PgClient } from '../src/lib/database.js';
import { logger } from '../src/utils/logger.js';
import * as path from 'path';
import * as fs from 'fs';

interface Migration {
  up: (client: PgClient) => Promise<void>;
  down: (client: PgClient) => Promise<void>;
}

interface MigrationRecord {
  id: number;
  name: string;
  applied_at: Date;
}

class MigrationRunner {
  private db: Database;

  constructor() {
    this.db = new Database();
  }

  async init(): Promise<void> {
    await this.db.connect();

    // Create migrations table if it doesn't exist
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  async getAppliedMigrations(): Promise<string[]> {
    const result = await this.db.query<MigrationRecord>(
      'SELECT name FROM migrations ORDER BY applied_at ASC'
    );
    return result.rows.map(row => row.name);
  }

  async getPendingMigrations(): Promise<string[]> {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter(file => file.endsWith('.ts'))
      .sort();

    const applied = await this.getAppliedMigrations();
    return files.filter(file => !applied.includes(file));
  }

  isMigration(obj: unknown): obj is Migration {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      typeof (obj as Migration).up === 'function' &&
      typeof (obj as Migration).down === 'function'
    );
  }

  async runMigration(
    fileName: string,
    direction: 'up' | 'down'
  ): Promise<void> {
    const migrationPath = path.join(__dirname, 'migrations', fileName);
    const module = (await import(migrationPath)) as unknown;
    if (!this.isMigration(module)) {
      throw new Error('Invalid migration module');
    }
    const migration = module;
    logger.info(`Running ${direction} migration: ${fileName}`);

    await this.db.transaction(async client => {
      if (direction === 'up') {
        await migration.up(client);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [
          fileName,
        ]);
      } else {
        await migration.down(client);
        await client.query('DELETE FROM migrations WHERE name = $1', [
          fileName,
        ]);
      }
    });

    logger.info(`Completed ${direction} migration: ${fileName}`);
  }

  async migrate(): Promise<void> {
    await this.init();

    const pending = await this.getPendingMigrations();

    if (pending.length === 0) {
      logger.info('No pending migrations');
      return;
    }

    logger.info(`Found ${pending.length} pending migrations`);

    for (const migration of pending) {
      await this.runMigration(migration, 'up');
    }

    logger.info('All migrations completed');
  }

  async rollback(steps: number = 1): Promise<void> {
    await this.init();

    const applied = await this.getAppliedMigrations();
    const toRollback = applied.slice(-steps).reverse();

    if (toRollback.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }

    logger.info(`Rolling back ${toRollback.length} migrations`);

    for (const migration of toRollback) {
      await this.runMigration(migration, 'down');
    }

    logger.info('Rollback completed');
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}

async function main() {
  const runner = new MigrationRunner();

  try {
    const command = process.argv[2] ?? 'migrate';

    switch (command) {
      case 'migrate':
        await runner.migrate();
        break;
      case 'rollback': {
        const steps = parseInt(process.argv[3] ?? '1');
        await runner.rollback(steps);
        break;
      }
      case 'status': {
        await runner.init();
        const pending = await runner.getPendingMigrations();
        const applied = await runner.getAppliedMigrations();

        console.log('Applied migrations:');
        applied.forEach(name => console.log(`  ✓ ${name}`));

        console.log('\nPending migrations:');
        pending.forEach(name => console.log(`  ○ ${name}`));
        break;
      }
      default:
        console.error(
          'Usage: bun migrate.ts [migrate|rollback|status] [steps]'
        );
        process.exit(1);
    }
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}
