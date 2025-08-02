#!/usr/bin/env bun

import { Database } from '../src/lib/database';
import { Migrator } from '../src/lib/migrator';
import { migration as initialSchema } from '../db/migrations/001_initial_schema';

const db = new Database({ filename: process.env.DB_FILE ?? 'tradebot.db' });
const migrator = new Migrator(db);

function main() {
  try {
    console.log('Starting database migration...');

    db.connect();
    migrator.runMigrations([initialSchema]);

    const executedMigrations = migrator.getExecutedMigrations();
    console.log('Executed migrations:', executedMigrations);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

if (import.meta.main) {
  main();
}
