-- Database Initialization Script for TradeBot
-- This script runs automatically when the PostgreSQL container starts
-- Contains only basic database setup - all schema changes are handled by migrations

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create main schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS tradebot;

-- Set search path to include our schema
SET search_path TO tradebot, public;