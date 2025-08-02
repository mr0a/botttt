import { Database } from './database.js';

export class Migrator {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  runMigrations(
    migrations: Array<{ name: string; up: (db: Database) => void }>
  ): void {
    console.log('Starting migrations...');

    // Create migrations table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    for (const migration of migrations) {
      const result = this.db.query(
        'SELECT name FROM migrations WHERE name = ?',
        [migration.name]
      );

      if (result.rowCount === 0) {
        console.log(`Running migration: ${migration.name}`);
        migration.up(this.db);

        this.db.query('INSERT INTO migrations (name) VALUES (?)', [
          migration.name,
        ]);

        console.log(`Completed migration: ${migration.name}`);
      } else {
        console.log(`Skipping migration: ${migration.name} (already executed)`);
      }
    }

    console.log('All migrations completed');
  }

  rollbackMigration(migrationName: string): void {
    console.log(`Rolling back migration: ${migrationName}`);

    const result = this.db.query('SELECT name FROM migrations WHERE name = ?', [
      migrationName,
    ]);

    if (result.rowCount > 0) {
      // Note: In a real implementation, you'd need down migrations
      console.log(
        `Would rollback: ${migrationName} (down migration not implemented)`
      );

      this.db.query('DELETE FROM migrations WHERE name = ?', [migrationName]);
    }
  }

  getExecutedMigrations(): string[] {
    const result = this.db.query(
      'SELECT name FROM migrations ORDER BY executed_at ASC'
    );

    return result.rows.map(row => (row as { name: string }).name);
  }
}
