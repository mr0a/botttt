# Database Migrations

This directory contains step-by-step database migrations for the TradeBot application. The migrations are designed to be executed in order and provide both `up` and `down` functions for forward and backward compatibility.

## Migration Overview

### 001_initial_schema.ts
- **Version**: 1.0.0
- **Description**: Create instruments and market data tables
- **Tables Created**:
  - `instruments` - Trading instruments (stocks, indices, etc.)
  - `tick_data` - Raw tick-by-tick market data
  - `ohlc_candles` - OHLC candlestick data
  - `order_book_snapshots` - Order book snapshots

### 002_create_order_management_tables.ts
- **Version**: 2.0.0
- **Description**: Create order management tables
- **Tables Created**:
  - `orders` - Trading orders
  - `order_history` - Order status change history

### 003_create_positions_and_strategies_tables.ts
- **Version**: 3.0.0
- **Description**: Create positions and strategies tables
- **Tables Created**:
  - `positions` - Trading positions
  - `strategies` - Trading strategy configurations

### 004_create_broker_credentials_table.ts
- **Version**: 4.0.0
- **Description**: Create broker credentials table
- **Tables Created**:
  - `broker_credentials` - Encrypted broker API credentials

### 005_create_indexes.ts
- **Version**: 5.0.0
- **Description**: Create all database indexes for performance optimization
- **Indexes Created**:
  - Performance indexes on all tables
  - Unique constraint for open positions per strategy-instrument pair

### 006_setup_hypertables.ts
- **Version**: 6.0.0
- **Description**: Convert time-series tables to TimescaleDB hypertables
- **Hypertables Created**:
  - `tick_data` (1-hour chunks)
  - `ohlc_candles` (1-day chunks)
  - `order_book_snapshots` (1-hour chunks)

### 007_setup_retention_policies.ts
- **Version**: 7.0.0
- **Description**: Setup data retention policies for hypertables
- **Retention Policies**:
  - `tick_data`: 30 days
  - `ohlc_candles`: 2 years
  - `order_book_snapshots`: 7 days

### 008_setup_compression.ts
- **Version**: 8.0.0
- **Description**: Setup compression settings and policies for hypertables
- **Compression Policies**:
  - `tick_data`: Compress after 7 days
  - `ohlc_candles`: Compress after 30 days
  - `order_book_snapshots`: Compress after 1 day

## Migration Execution

Migrations should be executed in numerical order. Each migration:

1. Tracks its execution in the `schema_migrations` table
2. Provides both `up()` and `down()` functions
3. Uses idempotent operations where possible (IF NOT EXISTS, etc.)

## Migration Dependencies

The migrations have logical dependencies:

- Migrations 002-004 depend on 001 (instruments table)
- Migration 005 depends on 001-004 (creates indexes on existing tables)
- Migration 006 depends on 001 (converts tables to hypertables)
- Migrations 007-008 depend on 006 (hypertable policies)
- Migration 009 depends on 001,003 (inserts data into instruments and strategies)

## Best Practices

1. **Always test migrations** on a copy of production data
2. **Run migrations during maintenance windows** for production
3. **Monitor TimescaleDB jobs** after applying hypertable-related migrations
4. **Verify data integrity** after each migration
5. **Keep backups** before running migrations in production