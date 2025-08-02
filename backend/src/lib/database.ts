import { logger } from '../utils/logger.js';

export interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
}

export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  details: {
    connected: boolean;
    queryTime?: number;
    error?: string;
  };
}

export interface PgClient {
  query(
    sql: string,
    params?: unknown[]
  ): Promise<{ rows: unknown[]; rowCount: number }>;
  connect(): Promise<void>;
  end(): Promise<void>;
}

export class Database {
  private client: PgClient | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig = {}) {
    this.config = {
      connectionString: process.env.DATABASE_URL ?? '',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      database: process.env.DB_NAME ?? 'tradebot',
      user: process.env.DB_USER ?? 'tradebot',
      password: process.env.DB_PASSWORD ?? 'tradebot123',
      ssl: process.env.DB_SSL === 'true',
      ...config,
    };
  }

  async connect(): Promise<void> {
    try {
      const { Client } = await import('pg');

      this.client = new Client({
        connectionString: this.config.connectionString,
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        ssl: this.config.ssl,
      });

      await this.client.connect();

      // Enable TimescaleDB extension
      await this.client.query('CREATE EXTENSION IF NOT EXISTS timescaledb');

      logger.info('Connected to PostgreSQL with TimescaleDB');
    } catch (error) {
      logger.error('Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }

  async query<T = unknown>(
    sql: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    try {
      const start = performance.now();
      const result = await this.client.query(sql, params);
      const queryTime = performance.now() - start;

      logger.debug(`Query executed in ${queryTime.toFixed(2)}ms`, {
        sql,
        params,
      });

      return {
        rows: result.rows as T[],
        rowCount: result.rowCount ?? 0,
      };
    } catch (error) {
      logger.error('Query failed:', { sql, params, error });
      throw error;
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    if (!this.client) {
      return {
        status: 'unhealthy',
        details: { connected: false, error: 'Not connected' },
      };
    }

    try {
      const start = performance.now();
      await this.client.query('SELECT 1');
      const queryTime = performance.now() - start;

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
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
      logger.info('Database connection closed');
    }
  }

  async transaction<T>(callback: (client: PgClient) => Promise<T>): Promise<T> {
    if (!this.client) {
      throw new Error('Database not connected');
    }

    const { Client } = await import('pg');
    const client = new Client({
      connectionString: this.config.connectionString,
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      ssl: this.config.ssl,
    });

    await client.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      await client.end();
    }
  }
}
