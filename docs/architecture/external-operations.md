# External Cron Jobs, Backups & Operational Tasks

## Realtime Analysis and Trading Application

### Document Information
- **Version**: 1.2
- **Date**: July 21, 2025
- **Author**: Technical Architect
- **Status**: Updated Draft

---

## Overview

This document defines external operational tasks, cron jobs, backup strategies, and maintenance procedures that run outside the main trading application to support continuous operation and data integrity.

## External Cron Jobs

### Scheduled Task Architecture

The application utilizes OS-level cron jobs for scheduled tasks, removing the need for an internal application scheduler. This approach ensures that critical maintenance tasks continue even if the main application is temporarily unavailable.

### Broker Data Management Tasks

#### Token and Instrument Updates

```bash
#!/bin/bash
# update_broker_data.sh - Script to update broker tokens and instruments

# Get current directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
APP_DIR="/opt/trading-app" # Path to your deployed application directory

# Change to application directory to access node_modules and Bun
cd "$APP_DIR" || exit

# --- Update Broker Tokens ---
echo "$(date): Updating broker tokens..." >> /var/log/trading_app_cron.log
# Execute a Bun script that interacts with the Broker Manager's authentication method
bun run scripts/updateTokens.ts || { echo "$(date): Failed to update tokens."; exit 1; }

# --- Update Instruments ---
echo "$(date): Updating instrument list..." >> /var/log/trading_app_cron.log
# Execute a Bun script that interacts with the Broker Manager's instrument refresh method
bun run scripts/refreshInstruments.ts || { echo "$(date): Failed to refresh instruments."; exit 1; }

echo "$(date): Broker data update complete." >> /var/log/trading_app_cron.log
```

#### Cron Schedule Configuration

```cron
# /etc/cron.d/trading_app_tasks

# Update broker tokens and instruments daily at 1 AM
0 1 * * * root /usr/local/bin/update_broker_data.sh >> /var/log/trading_app_cron.log 2>&1

# Market data cleanup every Sunday at 2 AM
0 2 * * 0 root /usr/local/bin/cleanup_old_data.sh >> /var/log/trading_app_cleanup.log 2>&1

# Database maintenance every day at 3 AM
0 3 * * * postgres /usr/local/bin/db_maintenance.sh >> /var/log/trading_app_db.log 2>&1

# System health check every hour
0 * * * * root /usr/local/bin/health_check.sh >> /var/log/trading_app_health.log 2>&1

# Log rotation daily at 4 AM
0 4 * * * root /usr/local/bin/rotate_logs.sh >> /var/log/trading_app_rotation.log 2>&1

# Weekly strategy performance report generation
0 6 * * 1 root /usr/local/bin/generate_weekly_report.sh >> /var/log/trading_app_reports.log 2>&1
```

### Token Management Scripts

#### updateTokens.ts

```typescript
// scripts/updateTokens.ts
import { BrokerManager } from '../src/broker/BrokerManager';
import { Database } from '../src/database/Database';
import { SecretsManager } from '../src/security/SecretsManager';

class TokenUpdater {
  private brokerManager: BrokerManager;
  private database: Database;
  private secretsManager: SecretsManager;

  constructor() {
    this.database = new Database();
    this.secretsManager = new SecretsManager();
    this.brokerManager = new BrokerManager(this.database, this.secretsManager);
  }

  async updateAllTokens(): Promise<void> {
    try {
      console.log('Starting token update process...');
      
      // Get all configured brokers
      const brokers = await this.database.query('SELECT * FROM broker_credentials WHERE is_active = true');
      
      for (const broker of brokers) {
        try {
          console.log(`Updating tokens for broker: ${broker.broker_name}`);
          
          // Decrypt credentials
          const credentials = await this.secretsManager.decryptBrokerCredentials(broker);
          
          // Update authentication token
          const newToken = await this.brokerManager.refreshAuthToken(broker.broker_name, credentials);
          
          if (newToken) {
            // Store updated token securely
            await this.secretsManager.updateBrokerToken(broker.id, newToken);
            console.log(`✓ Successfully updated token for ${broker.broker_name}`);
          }
          
        } catch (error) {
          console.error(`✗ Failed to update token for ${broker.broker_name}:`, error);
          
          // Log error to database for monitoring
          await this.database.query(
            'INSERT INTO system_alerts (type, severity, message, created_at) VALUES (?, ?, ?, NOW())',
            ['TOKEN_UPDATE_FAILED', 'HIGH', `Token update failed for ${broker.broker_name}: ${error.message}`]
          );
        }
      }
      
      console.log('Token update process completed');
      
    } catch (error) {
      console.error('Token update process failed:', error);
      process.exit(1);
    }
  }
}

// Execute token update
const tokenUpdater = new TokenUpdater();
tokenUpdater.updateAllTokens()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error in token update:', error);
    process.exit(1);
  });
```

## Backup & Recovery Strategy

### Database Backups

#### Daily Database Backup Script

```bash
#!/bin/bash
# db_backup.sh - Daily database backup script

BACKUP_DIR="/opt/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="trading_db"
DB_USER="trading_user"
DB_HOST="localhost"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "$(date): Starting database backup..." >> /var/log/trading_app_backup.log

# Full database backup
echo "$(date): Creating full database backup..." >> /var/log/trading_app_backup.log
pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/full_backup_$DATE.sql.gz"

if [ $? -eq 0 ]; then
    echo "$(date): ✓ Full backup completed successfully" >> /var/log/trading_app_backup.log
else
    echo "$(date): ✗ Full backup failed" >> /var/log/trading_app_backup.log
    exit 1
fi

# Schema-only backup for quick restoration
echo "$(date): Creating schema backup..." >> /var/log/trading_app_backup.log
pg_dump -h "$DB_HOST" -U "$DB_USER" -s "$DB_NAME" | gzip > "$BACKUP_DIR/schema_backup_$DATE.sql.gz"

# Critical tables backup (positions, orders, strategies)
echo "$(date): Creating critical tables backup..." >> /var/log/trading_app_backup.log
pg_dump -h "$DB_HOST" -U "$DB_USER" -t positions -t orders -t strategies -t order_history "$DB_NAME" | gzip > "$BACKUP_DIR/critical_backup_$DATE.sql.gz"

# Cleanup old backups
echo "$(date): Cleaning up old backups..." >> /var/log/trading_app_backup.log

# Keep only last 7 days of full backups
find "$BACKUP_DIR" -name "full_backup_*.sql.gz" -mtime +7 -delete

# Keep only last 30 days of schema backups
find "$BACKUP_DIR" -name "schema_backup_*.sql.gz" -mtime +30 -delete

# Keep only last 14 days of critical backups
find "$BACKUP_DIR" -name "critical_backup_*.sql.gz" -mtime +14 -delete

echo "$(date): Database backup process completed" >> /var/log/trading_app_backup.log
```

#### Application State Backup

```bash
#!/bin/bash
# app_state_backup.sh - Backup application configuration and logs

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/opt/trading-app"

echo "$(date): Starting application state backup..." >> /var/log/trading_app_backup.log

# Backup configuration files
echo "$(date): Backing up configuration files..." >> /var/log/trading_app_backup.log
tar -czf "$BACKUP_DIR/config/config_$DATE.tar.gz" \
  "$APP_DIR/.env" \
  "$APP_DIR/config/" \
  "$APP_DIR/docker-compose.yml" \
  "$APP_DIR/scripts/" 2>/dev/null

# Backup application logs
echo "$(date): Backing up application logs..." >> /var/log/trading_app_backup.log
tar -czf "$BACKUP_DIR/logs/logs_$DATE.tar.gz" \
  "$APP_DIR/logs/" \
  /var/log/trading_app*.log 2>/dev/null

# Backup strategy configurations and performance data
echo "$(date): Backing up strategy data..." >> /var/log/trading_app_backup.log
pg_dump -h localhost -U trading_user -t strategies -t strategy_performance trading_db | gzip > "$BACKUP_DIR/strategies/strategies_$DATE.sql.gz"

# Keep only last 14 days of configuration backups
find "$BACKUP_DIR/config" -name "config_*.tar.gz" -mtime +14 -delete

# Keep only last 7 days of log backups
find "$BACKUP_DIR/logs" -name "logs_*.tar.gz" -mtime +7 -delete

# Keep only last 30 days of strategy backups
find "$BACKUP_DIR/strategies" -name "strategies_*.tar.gz" -mtime +30 -delete

echo "$(date): Application state backup completed" >> /var/log/trading_app_backup.log
```

### Backup Verification and Testing

#### Backup Integrity Check

```bash
#!/bin/bash
# verify_backups.sh - Verify backup integrity

BACKUP_DIR="/opt/backups/postgres"
TEST_DB="trading_db_test"

echo "$(date): Starting backup verification..." >> /var/log/trading_app_verify.log

# Get latest backup
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/full_backup_*.sql.gz | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "$(date): ✗ No backup files found" >> /var/log/trading_app_verify.log
    exit 1
fi

echo "$(date): Verifying backup: $LATEST_BACKUP" >> /var/log/trading_app_verify.log

# Test backup integrity by attempting restore to test database
zcat "$LATEST_BACKUP" | psql -h localhost -U trading_user -d "$TEST_DB" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "$(date): ✓ Backup verification successful" >> /var/log/trading_app_verify.log
    # Cleanup test database
    dropdb -h localhost -U trading_user "$TEST_DB" 2>/dev/null
else
    echo "$(date): ✗ Backup verification failed" >> /var/log/trading_app_verify.log
    # Send alert
    echo "Backup verification failed for $LATEST_BACKUP" | mail -s "Trading App Backup Alert" admin@trading-app.com
    exit 1
fi

echo "$(date): Backup verification completed" >> /var/log/trading_app_verify.log
```

## Data Cleanup and Maintenance

### Old Data Cleanup

```bash
#!/bin/bash
# cleanup_old_data.sh - Clean up old market data and logs

echo "$(date): Starting data cleanup process..." >> /var/log/trading_app_cleanup.log

# Connect to database and run cleanup queries
psql -h localhost -U trading_user -d trading_db << EOF
-- Delete tick data older than 30 days
DELETE FROM tick_data WHERE time < NOW() - INTERVAL '30 days';

-- Delete order book snapshots older than 7 days
DELETE FROM order_book_snapshots WHERE time < NOW() - INTERVAL '7 days';

-- Delete old backtest results (keep last 100 per strategy)
WITH ranked_backtests AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY strategy_id ORDER BY created_at DESC) as rn
  FROM backtest_results
)
DELETE FROM backtest_results 
WHERE id IN (SELECT id FROM ranked_backtests WHERE rn > 100);

-- Clean up old system logs
DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '90 days';

-- Update table statistics
ANALYZE tick_data;
ANALYZE ohlc_candles;
ANALYZE orders;
ANALYZE positions;

EOF

# Clean up application log files
find /opt/trading-app/logs -name "*.log" -mtime +30 -delete
find /var/log -name "trading_app*.log" -mtime +90 -delete

echo "$(date): Data cleanup process completed" >> /var/log/trading_app_cleanup.log
```

### Database Maintenance

```bash
#!/bin/bash
# db_maintenance.sh - Database maintenance tasks

echo "$(date): Starting database maintenance..." >> /var/log/trading_app_db.log

# Run database maintenance queries
psql -h localhost -U trading_user -d trading_db << EOF

-- Vacuum and analyze critical tables
VACUUM ANALYZE tick_data;
VACUUM ANALYZE ohlc_candles;
VACUUM ANALYZE orders;
VACUUM ANALYZE positions;
VACUUM ANALYZE order_history;

-- Reindex frequently used indexes
REINDEX INDEX idx_tick_data_instrument_time;
REINDEX INDEX idx_ohlc_instrument_timeframe;
REINDEX INDEX idx_orders_strategy;
REINDEX INDEX idx_positions_strategy;

-- Update table statistics
ANALYZE;

-- Check for unused indexes
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
WHERE idx_tup_read = 0 AND idx_tup_fetch = 0;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

EOF

echo "$(date): Database maintenance completed" >> /var/log/trading_app_db.log
```

## System Health Monitoring

### Health Check Script

```bash
#!/bin/bash
# health_check.sh - System health monitoring

HEALTH_LOG="/var/log/trading_app_health.log"
ALERT_EMAIL="admin@trading-app.com"

echo "$(date): Starting health check..." >> "$HEALTH_LOG"

# Check if trading application is running
if ! pgrep -f "trading-app" > /dev/null; then
    echo "$(date): ✗ Trading application is not running" >> "$HEALTH_LOG"
    echo "Trading application is down" | mail -s "CRITICAL: Trading App Down" "$ALERT_EMAIL"
fi

# Check database connectivity
if ! pg_isready -h localhost -U trading_user -d trading_db > /dev/null 2>&1; then
    echo "$(date): ✗ Database is not accessible" >> "$HEALTH_LOG"
    echo "Database connectivity failed" | mail -s "CRITICAL: Database Down" "$ALERT_EMAIL"
fi

# Check disk space
DISK_USAGE=$(df /opt | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "$(date): ✗ Disk usage is at ${DISK_USAGE}%" >> "$HEALTH_LOG"
    echo "Disk usage critical: ${DISK_USAGE}%" | mail -s "WARNING: Disk Space Low" "$ALERT_EMAIL"
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEMORY_USAGE" -gt 90 ]; then
    echo "$(date): ✗ Memory usage is at ${MEMORY_USAGE}%" >> "$HEALTH_LOG"
    echo "Memory usage critical: ${MEMORY_USAGE}%" | mail -s "WARNING: Memory Usage High" "$ALERT_EMAIL"
fi

# Check log file sizes
LOG_SIZE=$(du -sm /opt/trading-app/logs | cut -f1)
if [ "$LOG_SIZE" -gt 1000 ]; then
    echo "$(date): ✗ Log files are using ${LOG_SIZE}MB" >> "$HEALTH_LOG"
fi

echo "$(date): Health check completed" >> "$HEALTH_LOG"
```

## Log Management

### Log Rotation

```bash
#!/bin/bash
# rotate_logs.sh - Log rotation and compression

LOG_DIR="/opt/trading-app/logs"
ARCHIVE_DIR="/opt/trading-app/logs/archive"
DATE=$(date +%Y%m%d)

echo "$(date): Starting log rotation..." >> /var/log/trading_app_rotation.log

# Create archive directory if it doesn't exist
mkdir -p "$ARCHIVE_DIR"

# Rotate application logs
for log_file in "$LOG_DIR"/*.log; do
    if [ -f "$log_file" ] && [ -s "$log_file" ]; then
        base_name=$(basename "$log_file" .log)
        
        # Compress and archive
        gzip -c "$log_file" > "$ARCHIVE_DIR/${base_name}_${DATE}.log.gz"
        
        # Truncate original log file
        > "$log_file"
        
        echo "$(date): Rotated $log_file" >> /var/log/trading_app_rotation.log
    fi
done

# Clean up old archived logs (keep 30 days)
find "$ARCHIVE_DIR" -name "*.log.gz" -mtime +30 -delete

echo "$(date): Log rotation completed" >> /var/log/trading_app_rotation.log
```

---

## Cross-References

- **Main Architecture**: See [`main-application-architecture.md`](main-application-architecture.md) for system overview
- **Database Schema**: See [`database-schema.md`](database-schema.md) for backup considerations
- **Monitoring**: See [`monitoring-observability.md`](monitoring-observability.md) for alerting integration

---

*These external operations ensure continuous system maintenance, data integrity, and operational reliability independent of the main trading application.*