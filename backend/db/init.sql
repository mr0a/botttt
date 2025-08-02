-- Database Initialization Script for TradeBot
-- This script runs automatically when the PostgreSQL container starts

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS tradebot;

-- Set search path
SET search_path TO tradebot, public;

-- Create instruments table
CREATE TABLE IF NOT EXISTS instruments (
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

-- Create tick data table (hypertable)
CREATE TABLE IF NOT EXISTS tick_data (
    time TIMESTAMPTZ NOT NULL,
    instrument_id INTEGER NOT NULL REFERENCES instruments(id),
    price DECIMAL(12,4) NOT NULL,
    quantity INTEGER NOT NULL,
    trade_id VARCHAR(50),
    exchange VARCHAR(20) NOT NULL,
    CONSTRAINT tick_data_pkey PRIMARY KEY (time, instrument_id)
);

-- Convert tick_data to hypertable if not already done
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables 
        WHERE hypertable_name = 'tick_data'
    ) THEN
        PERFORM create_hypertable('tick_data', 'time', chunk_time_interval => INTERVAL '1 hour');
    END IF;
END $$;

-- Create OHLC candles table (hypertable)
CREATE TABLE IF NOT EXISTS ohlc_candles (
    time TIMESTAMPTZ NOT NULL,
    instrument_id INTEGER NOT NULL REFERENCES instruments(id),
    timeframe VARCHAR(10) NOT NULL,
    open_price DECIMAL(12,4) NOT NULL,
    high_price DECIMAL(12,4) NOT NULL,
    low_price DECIMAL(12,4) NOT NULL,
    close_price DECIMAL(12,4) NOT NULL,
    volume BIGINT NOT NULL,
    trade_count INTEGER,
    vwap DECIMAL(12,4),
    CONSTRAINT ohlc_candles_pkey PRIMARY KEY (time, instrument_id, timeframe)
);

-- Convert ohlc_candles to hypertable if not already done
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables 
        WHERE hypertable_name = 'ohlc_candles'
    ) THEN
        PERFORM create_hypertable('ohlc_candles', 'time', chunk_time_interval => INTERVAL '1 day');
    END IF;
END $$;

-- Create order book snapshots table (hypertable)
CREATE TABLE IF NOT EXISTS order_book_snapshots (
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

-- Convert order_book_snapshots to hypertable if not already done
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables 
        WHERE hypertable_name = 'order_book_snapshots'
    ) THEN
        PERFORM create_hypertable('order_book_snapshots', 'time', chunk_time_interval => INTERVAL '1 hour');
    END IF;
END $$;

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id VARCHAR(100) NOT NULL,
    instrument_id INTEGER NOT NULL REFERENCES instruments(id),
    order_type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(12,4),
    order_kind VARCHAR(20) NOT NULL,
    current_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    broker_order_id VARCHAR(100),
    filled_quantity INTEGER DEFAULT 0,
    average_price DECIMAL(12,4),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    executed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

-- Create order history table
CREATE TABLE IF NOT EXISTS order_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    status VARCHAR(20) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    details JSONB
);

-- Create positions table
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id VARCHAR(100) NOT NULL,
    instrument_id INTEGER NOT NULL REFERENCES instruments(id),
    quantity INTEGER NOT NULL,
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

-- Create strategies table
CREATE TABLE IF NOT EXISTS strategies (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    class_name VARCHAR(100) NOT NULL,
    config JSONB NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    execution_mode VARCHAR(20) DEFAULT 'PAPER',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create broker credentials table
CREATE TABLE IF NOT EXISTS broker_credentials (
    id SERIAL PRIMARY KEY,
    broker_name VARCHAR(50) NOT NULL,
    encrypted_api_key BYTEA NOT NULL,
    encrypted_secret BYTEA NOT NULL,
    encryption_key_id VARCHAR(50) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create schema migrations table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    description TEXT,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_instruments_symbol ON instruments(symbol);
CREATE INDEX IF NOT EXISTS idx_instruments_active ON instruments(is_active);
CREATE INDEX IF NOT EXISTS idx_tick_data_instrument_time ON tick_data (instrument_id, time DESC);
CREATE INDEX IF NOT EXISTS idx_tick_data_price ON tick_data (price);
CREATE INDEX IF NOT EXISTS idx_ohlc_instrument_timeframe ON ohlc_candles (instrument_id, timeframe, time DESC);
CREATE INDEX IF NOT EXISTS idx_orders_strategy ON orders(strategy_id);
CREATE INDEX IF NOT EXISTS idx_orders_current_status ON orders(current_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_timestamp ON order_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_positions_strategy ON positions(strategy_id);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_strategies_enabled ON strategies(is_enabled);
CREATE INDEX IF NOT EXISTS idx_strategies_mode ON strategies(execution_mode);

-- Create unique index for open positions
CREATE UNIQUE INDEX IF NOT EXISTS idx_positions_strategy_instrument 
    ON positions(strategy_id, instrument_id) 
    WHERE status = 'OPEN';

-- Insert seed data for strategies
INSERT INTO strategies (id, name, description, class_name, config, execution_mode) VALUES
    ('ema_crossover', 'EMA Crossover Strategy', 'Simple EMA crossover with risk management', 'EMACrossoverStrategy', 
     '{"fast_ema": 9, "slow_ema": 21, "risk_percent": 1.0, "instruments": ["NIFTY", "BANKNIFTY"]}', 'PAPER'),
    ('support_resistance', 'Support Resistance Strategy', 'Price action at key levels', 'SupportResistanceStrategy',
     '{"lookback_periods": 20, "min_touches": 2, "risk_percent": 0.5, "instruments": ["NIFTY"]}', 'PAPER')
ON CONFLICT (id) DO NOTHING;

-- Insert seed data for instruments
INSERT INTO instruments (symbol, exchange, instrument_type, tick_size, lot_size) VALUES
    ('NIFTY', 'NSE', 'INDEX', 0.05, 1),
    ('BANKNIFTY', 'NSE', 'INDEX', 0.05, 1)
ON CONFLICT (symbol) DO NOTHING;

-- Set up data retention policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.jobs 
        WHERE proc_name = 'policy_retention' 
        AND hypertable_name = 'tick_data'
    ) THEN
        PERFORM add_retention_policy('tick_data', INTERVAL '30 days');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.jobs 
        WHERE proc_name = 'policy_retention' 
        AND hypertable_name = 'ohlc_candles'
    ) THEN
        PERFORM add_retention_policy('ohlc_candles', INTERVAL '2 years');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.jobs 
        WHERE proc_name = 'policy_retention' 
        AND hypertable_name = 'order_book_snapshots'
    ) THEN
        PERFORM add_retention_policy('order_book_snapshots', INTERVAL '7 days');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.jobs 
        WHERE proc_name = 'policy_retention' 
        AND hypertable_name = 'order_history'
    ) THEN
        PERFORM add_retention_policy('order_history', INTERVAL '5 years');
    END IF;
END $$;

-- Set up compression policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.jobs 
        WHERE proc_name = 'policy_compression' 
        AND hypertable_name = 'tick_data'
    ) THEN
        PERFORM add_compression_policy('tick_data', INTERVAL '7 days');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.jobs 
        WHERE proc_name = 'policy_compression' 
        AND hypertable_name = 'ohlc_candles'
    ) THEN
        PERFORM add_compression_policy('ohlc_candles', INTERVAL '30 days');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.jobs 
        WHERE proc_name = 'policy_compression' 
        AND hypertable_name = 'order_book_snapshots'
    ) THEN
        PERFORM add_compression_policy('order_book_snapshots', INTERVAL '1 day');
    END IF;
END $$;

-- Record schema version
INSERT INTO schema_migrations (version, description) 
VALUES ('1.0.0', 'Initial schema setup with all tables, indexes, and policies')
ON CONFLICT (version) DO NOTHING;