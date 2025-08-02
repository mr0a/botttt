import { Database as BunDatabase } from 'bun:sqlite';

export interface DatabaseConfig {
  filename?: string;
}

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

export class Database {
  private db: BunDatabase;

  constructor(config: DatabaseConfig = {}) {
    this.db = new BunDatabase(config.filename ?? ':memory:');
  }

  connect(): void {
    console.log('Database connected successfully');
  }

  query<T = Record<string, unknown>>(
    sql: string,
    params?: (string | number | boolean | null | Uint8Array)[]
  ): QueryResult<T> {
    try {
      const stmt = this.db.prepare(sql);
      const result = params ? stmt.all(...params) : stmt.all();
      return { rows: result as T[], rowCount: result.length };
    } catch (error) {
      console.error('Database query failed:', { query: sql, error });
      throw error;
    }
  }

  exec(sql: string): void {
    try {
      this.db.exec(sql);
    } catch (error) {
      console.error('Database exec failed:', { query: sql, error });
      throw error;
    }
  }

  healthCheck(): {
    status: 'healthy' | 'unhealthy';
    details: {
      connected: boolean;
      queryTime: number;
      error?: string;
    };
  } {
    const start = Date.now();
    try {
      this.db.prepare('SELECT 1').get();
      const queryTime = Date.now() - start;

      return {
        status: 'healthy',
        details: {
          connected: true,
          queryTime,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          queryTime: Date.now() - start,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  close(): void {
    if (this.db) {
      this.db.close();
      console.log('Database connection closed');
    }
  }

  runMigration(migration: { up: (db: Database) => void }): void {
    try {
      migration.up(this);
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
}
