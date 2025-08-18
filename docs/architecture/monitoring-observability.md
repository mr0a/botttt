# Monitoring, Observability & Logging

## Realtime Analysis and Trading Application

### Document Information
- **Version**: 1.2
- **Date**: July 21, 2025
- **Author**: Technical Architect
- **Status**: Updated Draft

---

## Overview

This document defines comprehensive monitoring, observability, and logging strategies for the trading application. The system requires extensive monitoring due to its critical financial nature and performance requirements.

## Monitoring Architecture

### Technology Stack

- **Metrics Collection**: Prometheus
- **Visualization**: Grafana
- **Logging**: Structured logging with JSON format
- **Alerting**: Grafana Alerts + Email/SMS notifications
- **Log Aggregation**: File-based with optional ELK stack integration
- **APM**: Custom performance tracking

## System Metrics

### Performance Metrics

```typescript
// Key performance indicators
interface PerformanceMetrics {
  // Latency metrics
  avgOrderExecutionTime: number;     // Target: < 300ms
  avgDataProcessingTime: number;     // Target: < 50ms
  avgAPIResponseTime: number;        // Target: < 100ms
  
  // Throughput metrics
  ordersPerSecond: number;
  ticksPerSecond: number;
  activeStrategies: number;
  
  // System metrics
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
}
```

### Business Metrics

```typescript
interface BusinessMetrics {
  // Trading metrics
  totalPnL: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  
  // Strategy metrics
  strategiesActive: number;
  strategiesEnabled: number;
  strategiesInError: number;
  
  // Risk metrics
  portfolioValue: number;
  totalExposure: number;
  riskAdjustedReturns: number;
}
```

## Prometheus Configuration

### Core Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "trading_alerts.yml"

scrape_configs:
  - job_name: 'trading-api'
    static_configs:
      - targets: ['trading-app-live:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s
    
  - job_name: 'trading-websocket'
    static_configs:
      - targets: ['trading-app-live:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s
    
  - job_name: 'postgresql'
    static_configs:
      - targets: ['postgres-exporter:9187']
    
  - job_name: 'system'
    static_configs:
      - targets: ['node-exporter:9100']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### Custom Metrics Implementation

```typescript
// Metrics collection service
import { register, Counter, Histogram, Gauge } from 'prom-client';

class TradingMetrics {
  // Performance metrics
  private orderExecutionTime = new Histogram({
    name: 'order_execution_duration_seconds',
    help: 'Time taken to execute orders',
    labelNames: ['strategy', 'instrument', 'order_type'],
    buckets: [0.01, 0.05, 0.1, 0.2, 0.3, 0.5, 1.0]
  });

  private dataProcessingTime = new Histogram({
    name: 'data_processing_duration_seconds',
    help: 'Time taken to process market data',
    labelNames: ['data_type', 'instrument'],
    buckets: [0.001, 0.005, 0.01, 0.02, 0.05, 0.1]
  });

  private apiResponseTime = new Histogram({
    name: 'api_response_duration_seconds',
    help: 'API endpoint response times',
    labelNames: ['method', 'endpoint', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0]
  });

  // Throughput metrics
  private ordersTotal = new Counter({
    name: 'orders_total',
    help: 'Total number of orders placed',
    labelNames: ['strategy', 'instrument', 'order_type', 'status']
  });

  private ticksProcessed = new Counter({
    name: 'ticks_processed_total',
    help: 'Total number of ticks processed',
    labelNames: ['instrument', 'exchange']
  });

  private strategiesActive = new Gauge({
    name: 'strategies_active',
    help: 'Number of currently active strategies'
  });

  // Business metrics
  private portfolioPnL = new Gauge({
    name: 'portfolio_pnl_total',
    help: 'Total portfolio P&L',
    labelNames: ['currency']
  });

  private strategyPnL = new Gauge({
    name: 'strategy_pnl',
    help: 'Individual strategy P&L',
    labelNames: ['strategy_id']
  });

  private riskMetrics = new Gauge({
    name: 'risk_metrics',
    help: 'Risk management metrics',
    labelNames: ['metric_type']
  });

  // Record order execution
  recordOrderExecution(strategy: string, instrument: string, orderType: string, duration: number): void {
    this.orderExecutionTime
      .labels(strategy, instrument, orderType)
      .observe(duration);
    
    this.ordersTotal
      .labels(strategy, instrument, orderType, 'executed')
      .inc();
  }

  // Record data processing
  recordDataProcessing(dataType: string, instrument: string, duration: number): void {
    this.dataProcessingTime
      .labels(dataType, instrument)
      .observe(duration);
    
    if (dataType === 'tick') {
      this.ticksProcessed
        .labels(instrument, 'NSE')
        .inc();
    }
  }

  // Record API metrics
  recordAPICall(method: string, endpoint: string, statusCode: number, duration: number): void {
    this.apiResponseTime
      .labels(method, endpoint, statusCode.toString())
      .observe(duration);
  }

  // Update business metrics
  updatePortfolioPnL(pnl: number): void {
    this.portfolioPnL.labels('INR').set(pnl);
  }

  updateStrategyPnL(strategyId: string, pnl: number): void {
    this.strategyPnL.labels(strategyId).set(pnl);
  }

  updateActiveStrategies(count: number): void {
    this.strategiesActive.set(count);
  }

  updateRiskMetrics(maxDrawdown: number, var1d: number, exposure: number): void {
    this.riskMetrics.labels('max_drawdown').set(maxDrawdown);
    this.riskMetrics.labels('var_1d').set(var1d);
    this.riskMetrics.labels('total_exposure').set(exposure);
  }
}
```

## Critical Alerts Configuration

### Alert Rules

```yaml
# trading_alerts.yml
groups:
  - name: trading_critical
    rules:
      - alert: HighLatency
        expr: histogram_quantile(0.95, order_execution_duration_seconds_bucket) > 0.3
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: "Order execution latency exceeded 300ms"
          description: "95th percentile order execution time is {{ $value }}s"
          
      - alert: DataFeedDown
        expr: up{job="trading-api"} == 0
        for: 10s
        labels:
          severity: critical
        annotations:
          summary: "Data ingestion service is down"
          description: "Trading application is not responding to health checks"
          
      - alert: HighRisk
        expr: risk_metrics{metric_type="total_exposure"} > 1000000
        for: 0s
        labels:
          severity: warning
        annotations:
          summary: "Portfolio exposure exceeds limit"
          description: "Total exposure is {{ $value }} INR"
          
      - alert: StrategyError
        expr: increase(orders_total{status="error"}[5m]) > 5
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Multiple strategy execution errors detected"
          description: "{{ $value }} order errors in the last 5 minutes"
          
      - alert: DatabaseConnectionLoss
        expr: up{job="postgresql"} == 0
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: "Database connection lost"
          description: "PostgreSQL database is not accessible"
          
      - alert: MemoryUsageHigh
        expr: (process_resident_memory_bytes / 1024 / 1024 / 1024) > 8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Application memory usage is {{ $value }}GB"
          
      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) < 0.1
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Disk space critically low"
          description: "Only {{ $value | humanizePercentage }} disk space remaining"

  - name: trading_performance
    rules:
      - alert: SlowDataProcessing
        expr: histogram_quantile(0.95, data_processing_duration_seconds_bucket{data_type="tick"}) > 0.05
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Slow tick data processing"
          description: "95th percentile tick processing time is {{ $value }}s"
          
      - alert: LowThroughput
        expr: rate(ticks_processed_total[1m]) < 50
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low tick data throughput"
          description: "Processing only {{ $value }} ticks per second"
```

## Logging Strategy

### Structured Logging Implementation

```typescript
// Centralized logging configuration
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(info => {
      return JSON.stringify({
        timestamp: info.timestamp,
        level: info.level,
        message: info.message,
        service: 'trading-app',
        ...info
      });
    })
  ),
  defaultMeta: { service: 'trading-app', version: process.env.APP_VERSION },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 20971520, // 20MB
      maxFiles: 10
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Trading-specific log events
class TradingLogger {
  logOrderPlaced(order: OrderRequest): void {
    logger.info('Order placed', {
      event: 'ORDER_PLACED',
      orderId: order.id,
      strategyId: order.strategy_id,
      instrument: order.instrument,
      quantity: order.quantity,
      price: order.price,
      orderType: order.order_type,
      executionMode: order.execution_mode
    });
  }

  logOrderFilled(order: OrderResponse): void {
    logger.info('Order filled', {
      event: 'ORDER_FILLED',
      orderId: order.order_id,
      filledQuantity: order.filled_quantity,
      averagePrice: order.average_price,
      brokerOrderId: order.broker_order_id
    });
  }

  logStrategySignal(signal: TradingSignal): void {
    logger.info('Strategy signal generated', {
      event: 'STRATEGY_SIGNAL',
      strategyId: signal.strategyId,
      instrument: signal.instrument,
      signalType: signal.type,
      price: signal.price,
      confidence: signal.confidence
    });
  }

  logRiskAlert(alert: RiskAlert): void {
    logger.warn('Risk alert triggered', {
      event: 'RISK_ALERT',
      alertType: alert.type,
      severity: alert.severity,
      message: alert.message,
      affectedStrategies: alert.affected_strategies,
      currentValue: alert.current_value,
      threshold: alert.threshold
    });
  }

  logBrokerConnection(event: string, brokerId: string, status: string): void {
    logger.info('Broker connection event', {
      event: 'BROKER_CONNECTION',
      brokerId,
      status,
      eventType: event
    });
  }

  logPerformanceMetrics(metrics: PerformanceMetrics): void {
    logger.info('Performance metrics', {
      event: 'PERFORMANCE_METRICS',
      avgOrderExecutionTime: metrics.avgOrderExecutionTime,
      avgDataProcessingTime: metrics.avgDataProcessingTime,
      ordersPerSecond: metrics.ordersPerSecond,
      ticksPerSecond: metrics.ticksPerSecond,
      activeStrategies: metrics.activeStrategies
    });
  }

  logError(error: Error, context?: any): void {
    logger.error('Application error', {
      event: 'ERROR',
      message: error.message,
      stack: error.stack,
      context
    });
  }
}
```

### Log Analysis and Retention

```bash
# Log analysis script
#!/bin/bash
# analyze_logs.sh - Extract key metrics from logs

LOG_FILE="/opt/trading-app/logs/combined.log"
OUTPUT_DIR="/opt/trading-app/analysis"
DATE=$(date +%Y%m%d)

mkdir -p "$OUTPUT_DIR"

echo "Analyzing logs for $(date)..."

# Extract order statistics
echo "=== Order Statistics ===" > "$OUTPUT_DIR/daily_stats_$DATE.txt"
grep "ORDER_PLACED" "$LOG_FILE" | jq -r '.timestamp' | wc -l >> "$OUTPUT_DIR/daily_stats_$DATE.txt"
echo "Total orders placed today: $(grep "ORDER_PLACED" "$LOG_FILE" | jq -r '.timestamp' | wc -l)"

# Extract error patterns
echo "=== Error Analysis ===" >> "$OUTPUT_DIR/daily_stats_$DATE.txt"
grep "ERROR" "$LOG_FILE" | jq -r '.message' | sort | uniq -c | sort -nr > "$OUTPUT_DIR/errors_$DATE.txt"

# Extract performance metrics
echo "=== Performance Metrics ===" >> "$OUTPUT_DIR/daily_stats_$DATE.txt"
grep "PERFORMANCE_METRICS" "$LOG_FILE" | tail -10 | jq '.avgOrderExecutionTime' > "$OUTPUT_DIR/latency_$DATE.txt"

# Extract strategy performance
echo "=== Strategy Activity ===" >> "$OUTPUT_DIR/daily_stats_$DATE.txt"
grep "STRATEGY_SIGNAL" "$LOG_FILE" | jq -r '.strategyId' | sort | uniq -c | sort -nr > "$OUTPUT_DIR/strategy_activity_$DATE.txt"

echo "Log analysis completed. Results saved to $OUTPUT_DIR/"
```

## Grafana Dashboards

### Trading Operations Dashboard

```json
{
  "dashboard": {
    "title": "Trading Operations Dashboard",
    "panels": [
      {
        "title": "Order Execution Latency",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, order_execution_duration_seconds_bucket)",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, order_execution_duration_seconds_bucket)",
            "legendFormat": "50th percentile"
          }
        ],
        "yAxes": [
          {
            "max": 0.5,
            "min": 0,
            "unit": "s"
          }
        ],
        "alert": {
          "conditions": [
            {
              "query": {
                "params": ["A", "1m", "now"]
              },
              "reducer": {
                "type": "avg"
              },
              "evaluator": {
                "params": [0.3],
                "type": "gt"
              }
            }
          ],
          "executionErrorState": "alerting",
          "for": "30s",
          "frequency": "10s",
          "handler": 1,
          "name": "High Order Latency",
          "noDataState": "no_data"
        }
      },
      {
        "title": "Active Strategies",
        "type": "singlestat",
        "targets": [
          {
            "expr": "strategies_active",
            "legendFormat": "Active Strategies"
          }
        ]
      },
      {
        "title": "Portfolio P&L",
        "type": "graph",
        "targets": [
          {
            "expr": "portfolio_pnl_total",
            "legendFormat": "Total P&L"
          }
        ]
      },
      {
        "title": "Data Processing Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(ticks_processed_total[1m])",
            "legendFormat": "Ticks/sec"
          }
        ]
      }
    ]
  }
}
```

### System Health Dashboard

```json
{
  "dashboard": {
    "title": "System Health Dashboard",
    "panels": [
      {
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(process_cpu_seconds_total[1m]) * 100",
            "legendFormat": "CPU %"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "process_resident_memory_bytes / 1024 / 1024",
            "legendFormat": "Memory MB"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends",
            "legendFormat": "Active Connections"
          }
        ]
      }
    ]
  }
}
```

## Error Tracking and Alerting

### Alert Manager Configuration

```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@trading-app.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
  routes:
  - match:
      severity: critical
    receiver: 'critical-alerts'
  - match:
      severity: warning
    receiver: 'warning-alerts'

receivers:
- name: 'web.hook'
  webhook_configs:
  - url: 'http://trading-app:3000/api/alerts/webhook'

- name: 'critical-alerts'
  email_configs:
  - to: 'admin@trading-app.com'
    subject: 'CRITICAL: Trading App Alert'
    body: |
      Alert: {{ .GroupLabels.alertname }}
      Summary: {{ .CommonAnnotations.summary }}
      Description: {{ .CommonAnnotations.description }}
  
- name: 'warning-alerts'
  email_configs:
  - to: 'ops@trading-app.com'
    subject: 'WARNING: Trading App Alert'
    body: |
      Alert: {{ .GroupLabels.alertname }}
      Summary: {{ .CommonAnnotations.summary }}
```

---

## Cross-References

- **Main Architecture**: See [`main-application-architecture.md`](main-application-architecture.md) for system overview
- **External Operations**: See [`external-operations.md`](external-operations.md) for health check scripts
- **Database Schema**: See [`database-schema.md`](database-schema.md) for monitoring data storage
- **API Specifications**: See [`api-websocket-specs.md`](api-websocket-specs.md) for metrics endpoints

---

*This monitoring and observability framework ensures comprehensive visibility into system performance, trading operations, and business metrics with proactive alerting for critical issues.*