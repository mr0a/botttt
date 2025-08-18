# Database Schema, Seed Data & Related Architecture

## Realtime Analysis and Trading Application

### Document Information
- **Version**: 1.2
- **Date**: July 21, 2025
- **Author**: Technical Architect
- **Status**: Updated Draft

---

## Database Architecture Overview

The application uses PostgreSQL with TimescaleDB extension for optimized time-series data storage and retrieval. The database is designed to handle high-frequency tick data, trading positions, strategy configurations, and comprehensive audit trails.

### Database Technology Stack

- **Primary Database**: PostgreSQL 15+
- **Time-Series Extension**: TimescaleDB 2.x
- **Connection Driver**: Bun's built-in postgres driver
- **Connection Pooling**: Built-in native pooling
- **Migration System**: Custom TypeScript scripts using Bun's file system APIs

## TimescaleDB Schema Design

### 1. Instruments Table

```sql
CREATE TABLE instruments (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(50) NOT NULL UNIQUE,
    exchange VARCHAR(20) NOT NULL,
    instrument_type VARCHAR(20) NOT NULL,
    tick_size DECIMAL(10,4),
    lot_size INTEGER,
    expiry_date DATE,
    strike_price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_instruments_symbol ON instruments(symbol);
CREATE INDEX idx_instruments_active ON instruments(is_active);
```

**Purpose**: Central registry of all tradable instruments with their specifications and metadata.

**Seed Data Strategy**: Populated via external broker API calls during application startup or via external cron jobs.

### 2. Tick Data Table (Hypertable)

```sql
CREATE TABLE tick_data (
    time TIMESTAMPTZ NOT NULL,
    instrument_id INTEGER NOT NULL REFERENCES instruments(id),
    price DECIMAL(12,4) NOT NULL,
    quantity INTEGER NOT NULL,
    trade_id VARCHAR(50),
    exchange VARCHAR(20) NOT NULL,
    CONSTRAINT tick_data_pkey PRIMARY KEY (time, instrument_id)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('tick_data', 'time', chunk_time_interval => INTERVAL '1 hour');

-- Create indexes for efficient querying
CREATE INDEX idx_tick_data_instrument_time ON tick_data (instrument_id, time DESC);
CREATE INDEX idx_tick_data_price ON tick_data (price);
```

**Purpose**: Stores raw tick-by-tick market data for real-time processing and historical analysis.

**Performance Optimizations**: 
- Partitioned by time for optimal time-series queries
- Composite primary key for uniqueness and performance
- Specialized indexes for common query patterns

### 3. OHLC Candles Table (Hypertable)

```sql
CREATE TABLE ohlc_candles (
    time TIMESTAMPTZ NOT NULL,
    instrument_id INTEGER NOT NULL REFERENCES instruments(id),
    timeframe VARCHAR(10) NOT NULL, -- '1s', '5s', '1m', '5m', etc.
    open_price DECIMAL(12,4) NOT NULL,
    high_price DECIMAL(12,4) NOT NULL,
    low_price DECIMAL(12,4) NOT NULL,
    close_price DECIMAL(12,4) NOT NULL,
    volume BIGINT NOT NULL,
    trade_count INTEGER,
    vwap DECIMAL(12,4),
    CONSTRAINT ohlc_candles_pkey PRIMARY KEY (time, instrument_id, timeframe)
);

SELECT create_hypertable('ohlc_candles', 'time', chunk_time_interval => INTERVAL '1 day');

CREATE INDEX idx_ohlc_instrument_timeframe ON ohlc_candles (instrument_id, timeframe, time DESC);
```

**Purpose**: Aggregated price data for charting and strategy analysis.

**Data Generation**: Computed from tick data in real-time by the Analysis Engine.

### 4. Order Book Data Table (Hypertable)

```sql
CREATE TABLE order_book_snapshots (
    time TIMESTAMPTZ NOT NULL,
    instrument_id INTEGER NOT NULL REFERENCES instruments(id),
    bid_prices DECIMAL(12,4)[] NOT NULL,
    bid_quantities INTEGER[] NOT NULL,
    ask_prices DECIMAL(12,4)[] NOT NULL,
    ask_quantities INTEGER[] NOT NULL,
    total_bid_quantity BIGINT,
    total_ask_quantity BIGINT,
    CONSTRAINT order_book_pkey PRIMARY KEY (time, instrument_id)
);

SELECT create_hypertable('order_book_snapshots', 'time', chunk_time_interval => INTERVAL '1 hour');
```

**Purpose**: Market depth information for advanced trading analysis and execution optimization.

### 5. Orders Table

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id VARCHAR(100) NOT NULL,
    instrument_id INTEGER NOT NULL REFERENCES instruments(id),
    order_type VARCHAR(20) NOT NULL, -- 'BUY', 'SELL'
    quantity INTEGER NOT NULL,
    price DECIMAL(12,4),
    order_kind VARCHAR(20) NOT NULL, -- 'MARKET', 'LIMIT', 'SL', 'SL-M'
    current_status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- Current status for quick lookup
    broker_order_id VARCHAR(100),
    filled_quantity INTEGER DEFAULT 0,
    average_price DECIMAL(12,4),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    executed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

CREATE INDEX idx_orders_strategy ON orders(strategy_id);
CREATE INDEX idx_orders_current_status ON orders(current_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```

**Purpose**: Complete order management with full lifecycle tracking.

### 6. Order History Table

```sql
CREATE TABLE order_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    status VARCHAR(20) NOT NULL, -- e.g., 'PENDING', 'OPEN', 'FILLED', 'CANCELLED', 'REJECTED'
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    details JSONB, -- Optional: Store additional details like reason for rejection
    CONSTRAINT fk_order_history_order FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX idx_order_history_order_id ON order_history(order_id);
CREATE INDEX idx_order_history_timestamp ON order_history(timestamp DESC);
```

**Purpose**: Complete audit trail of all order status changes.

### 7. Positions Table

```sql
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id VARCHAR(100) NOT NULL,
    instrument_id INTEGER NOT NULL REFERENCES instruments(id),
    quantity INTEGER NOT NULL, -- Positive for long, negative for short
    average_entry_price DECIMAL(12,4) NOT NULL,
    current_price DECIMAL(12,4),
    unrealized_pnl DECIMAL(12,2),
    realized_pnl DECIMAL(12,2) DEFAULT 0,
    stop_loss_price DECIMAL(12,4),
    target_price DECIMAL(12,4),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

CREATE INDEX idx_positions_strategy ON positions(strategy_id);
CREATE INDEX idx_positions_status ON positions(status);
CREATE UNIQUE INDEX idx_positions_strategy_instrument ON positions(strategy_id, instrument_id) 
    WHERE status = 'OPEN';
```

**Purpose**: Real-time position tracking with P&L calculations.

### 8. Strategies Table

```sql
CREATE TABLE strategies (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    class_name VARCHAR(100) NOT NULL,
    config JSONB NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    execution_mode VARCHAR(20) DEFAULT 'PAPER', -- 'LIVE', 'PAPER'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_strategies_enabled ON strategies(is_enabled);
CREATE INDEX idx_strategies_mode ON strategies(execution_mode);
```

**Purpose**: Strategy configuration and state management.

### 9. Broker Credentials Table

```sql
CREATE TABLE broker_credentials (
    id SERIAL PRIMARY KEY,
    broker_name VARCHAR(50) NOT NULL,
    encrypted_api_key BYTEA NOT NULL,
    encrypted_secret BYTEA NOT NULL,
    encryption_key_id VARCHAR(50) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb, -- Store broker-specific config data
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Secure storage of broker authentication credentials.

## Data Retention Policies

```sql
-- Tick data retention: 30 days for high-frequency, 1 year for daily aggregates
SELECT add_retention_policy('tick_data', INTERVAL '30 days');

-- OHLC candles retention: 2 years
SELECT add_retention_policy('ohlc_candles', INTERVAL '2 years');

-- Order book snapshots retention: 7 days
SELECT add_retention_policy('order_book_snapshots', INTERVAL '7 days');

-- Order history retention: 5 years
SELECT add_retention_policy('order_history', INTERVAL '5 years');
```

## Seed Data Strategy

### Instrument Data Seeding

```typescript
// Example seed data script for instruments
interface InstrumentSeedData {
  symbol: string;
  exchange: string;
  instrument_type: string;
  tick_size: number;
  lot_size: number;
  expiry_date?: Date;
  strike_price?: number;
}

const seedInstruments: InstrumentSeedData[] = [
  {
    symbol: 'NIFTY',
    exchange: 'NSE',
    instrument_type: 'INDEX',
    tick_size: 0.05,
    lot_size: 1,
  },
  {
    symbol: 'BANKNIFTY',
    exchange: 'NSE',
    instrument_type: 'INDEX',
    tick_size: 0.05,
    lot_size: 1,
  },
  // Options and futures data populated dynamically from broker
];
```

### Strategy Configuration Seeding

```sql
-- Example strategy configurations
INSERT INTO strategies (id, name, description, class_name, config, execution_mode) VALUES
('ema_crossover', 'EMA Crossover Strategy', 'Simple EMA crossover with risk management', 'EMACrossoverStrategy', 
 '{"fast_ema": 9, "slow_ema": 21, "risk_percent": 1.0, "instruments": ["NIFTY", "BANKNIFTY"]}', 'PAPER'),
('support_resistance', 'Support Resistance Strategy', 'Price action at key levels', 'SupportResistanceStrategy',
 '{"lookback_periods": 20, "min_touches": 2, "risk_percent": 0.5, "instruments": ["NIFTY"]}', 'PAPER');
```

## Database Performance Optimizations

### Connection Management

```typescript
// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  pool: {
    min: 5,
    max: 20,
    acquireTimeoutMs: 30000,
    createTimeoutMs: 30000,
    destroyTimeoutMs: 5000,
    idleTimeoutMs: 30000,
    reapIntervalMs: 1000,
  },
};
```

### Query Optimization Strategies

1. **Prepared Statements**: Pre-compiled queries for frequently executed operations
2. **Batch Inserts**: Bulk operations for tick data ingestion
3. **Partitioning**: Time-based partitioning for efficient data access
4. **Indexing**: Strategic indexes for common query patterns
5. **Connection Pooling**: Reuse database connections for optimal performance

### Data Archival Strategy

```sql
-- Automated data compression for older partitions
SELECT add_compression_policy('tick_data', INTERVAL '7 days');
SELECT add_compression_policy('ohlc_candles', INTERVAL '30 days');
SELECT add_compression_policy('order_book_snapshots', INTERVAL '1 day');
```

## Migration Management

### Migration Framework

```typescript
// Example migration structure
export interface Migration {
  version: string;
  description: string;
  up: (db: Database) => Promise<void>;
  down: (db: Database) => Promise<void>;
}

// Migration execution
class MigrationRunner {
  async runMigrations(): Promise<void> {
    const pendingMigrations = await this.getPendingMigrations();
    for (const migration of pendingMigrations) {
      await migration.up(this.db);
      await this.recordMigration(migration.version);
    }
  }
}
```

### Schema Versioning

```sql
CREATE TABLE schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    description TEXT,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Backup and Recovery

### Backup Strategy

```bash
#!/bin/bash
# Daily backup script
BACKUP_DIR="/opt/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)

# Full database backup
pg_dump -h localhost -U trading_user trading_db | gzip > "$BACKUP_DIR/full_backup_$DATE.sql.gz"

# Incremental backup for time-series data
pg_dump -h localhost -U trading_user -t tick_data -t ohlc_candles trading_db | gzip > "$BACKUP_DIR/timeseries_backup_$DATE.sql.gz"

# Keep only last 7 days of full backups
find $BACKUP_DIR -name "full_backup_*.sql.gz" -mtime +7 -delete

# Keep only last 30 days of incremental backups
find $BACKUP_DIR -name "timeseries_backup_*.sql.gz" -mtime +30 -delete
```

### Recovery Procedures

1. **Point-in-Time Recovery**: Using PostgreSQL's WAL-based recovery
2. **Selective Table Recovery**: Restore specific tables without full database restore
3. **Cross-Validation**: Verify data integrity after recovery operations

---

## Cross-References

- **Main Architecture**: See [`main-application-architecture.md`](main-application-architecture.md) for overall system design
- **Component Specifications**: See individual component files for data access patterns
- **API Design**: See [`api-websocket-specs.md`](api-websocket-specs.md) for data API endpoints
- **Monitoring**: See [`monitoring-observability.md`](monitoring-observability.md) for database monitoring

---

*This database schema provides the foundation for reliable, high-performance data storage and retrieval in the trading application.*