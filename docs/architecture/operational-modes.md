# Operational Modes & Implementation

## Realtime Analysis and Trading Application

### Document Information
- **Version**: 1.2
- **Date**: July 21, 2025
- **Author**: Technical Architect
- **Status**: Updated Draft

---

## Overview

This document defines the different operational modes of the application, enabled by separate executable entry points. This ensures clear operational boundaries and optimized resource management for each use case.

## Operational Architecture

### Mode Isolation Strategy

The application supports multiple operational modes through separate executable entry points, each optimized for specific use cases. This design ensures:

- **Resource Optimization**: Each mode only loads necessary components
- **Operational Safety**: Live trading and backtesting cannot interfere with each other
- **Maintenance Flexibility**: Modes can be updated or restarted independently
- **Clear Separation**: Distinct configurations and data flows for each mode

## Mode Definitions

### 1. Live/Paper Trading Mode

This mode is designed for continuous, real-time operation.

**Entry Point**: `bun run start:live`

**Active Components**: All core modules are active: Data Ingestion, Analysis Engine, Trading Engine (configured for live or paper), Strategy Manager, Risk Manager, Broker Manager, and the HTTP/WebSocket Server.

**Purpose**: To execute strategies against live market data (either real or simulated for paper trading), manage positions, and provide real-time UI updates.

**Characteristics**: Long-running process, requires continuous broker connectivity, active risk management.

#### Implementation Details

```typescript
// src/modes/live-trading.ts
import { Application } from '../core/Application';
import { LiveTradingConfig } from '../config/LiveTradingConfig';

class LiveTradingMode {
  private app: Application;
  private config: LiveTradingConfig;

  constructor() {
    this.config = new LiveTradingConfig();
    this.app = new Application(this.config);
  }

  async start(): Promise<void> {
    console.log('Starting Live Trading Mode...');
    
    // Initialize all components for live trading
    await this.app.initialize({
      mode: 'LIVE_TRADING',
      components: [
        'DataIngestion',
        'AnalysisEngine', 
        'TradingEngine',
        'StrategyManager',
        'RiskManager',
        'BrokerManager',
        'HTTPServer',
        'WebSocketServer'
      ],
      enableRealTimeProcessing: true,
      enableBrokerConnections: true,
      enableRiskManagement: true,
      enableWebInterface: true
    });

    // Set up signal handlers for graceful shutdown
    this.setupSignalHandlers();

    // Start the application
    await this.app.start();
    
    console.log('Live Trading Mode started successfully');
  }

  private setupSignalHandlers(): void {
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
  }

  private async gracefulShutdown(): Promise<void> {
    console.log('Received shutdown signal, stopping Live Trading Mode...');
    
    // Graceful shutdown sequence
    await this.app.stop();
    process.exit(0);
  }
}

// Entry point for live trading mode
if (require.main === module) {
  const liveTrading = new LiveTradingMode();
  liveTrading.start().catch(error => {
    console.error('Failed to start Live Trading Mode:', error);
    process.exit(1);
  });
}
```

#### Configuration for Live Trading

```typescript
// src/config/LiveTradingConfig.ts
export class LiveTradingConfig {
  public readonly mode = 'LIVE_TRADING';
  
  public readonly database = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'trading_db',
    maxConnections: 20
  };

  public readonly brokers = {
    primary: process.env.PRIMARY_BROKER || 'zerodha',
    enableBackups: true,
    connectionTimeout: 30000,
    reconnectAttempts: 5
  };

  public readonly strategies = {
    autoLoadEnabled: true,
    maxConcurrent: 40,
    defaultExecutionMode: process.env.DEFAULT_EXECUTION_MODE || 'PAPER'
  };

  public readonly riskManagement = {
    enabled: true,
    maxPortfolioRisk: 0.02, // 2%
    maxSinglePositionRisk: 0.005, // 0.5%
    emergencyStopEnabled: true
  };

  public readonly webServer = {
    enabled: true,
    port: parseInt(process.env.HTTP_PORT || '3000'),
    enableWebSocket: true,
    enableMetrics: true
  };
}
```

### 2. Backtesting Mode

This mode is designed for historical simulation and strategy optimization.

**Entry Point**: `bun run start:backtest`

**Active Components**: Primarily the historical data loader, Analysis Engine, Strategy Manager, and a simulated Trading Engine/Risk Manager (which interacts with historical data instead of live broker APIs).

**Purpose**: To run strategies against historical data to evaluate performance, identify optimal parameters, and validate strategy logic without real-time market pressure or broker interaction.

**Characteristics**: Typically a batch process, can be resource-intensive depending on the historical data range, does not require continuous broker connectivity.

#### Implementation Details

```typescript
// src/modes/backtesting.ts
import { Application } from '../core/Application';
import { BacktestingConfig } from '../config/BacktestingConfig';
import { BacktestRequest } from '../types/BacktestRequest';

class BacktestingMode {
  private app: Application;
  private config: BacktestingConfig;

  constructor() {
    this.config = new BacktestingConfig();
    this.app = new Application(this.config);
  }

  async start(): Promise<void> {
    console.log('Starting Backtesting Mode...');
    
    // Initialize components for backtesting
    await this.app.initialize({
      mode: 'BACKTESTING',
      components: [
        'HistoricalDataLoader',
        'AnalysisEngine',
        'VirtualTradingEngine',
        'StrategyManager',
        'BacktestEngine'
      ],
      enableRealTimeProcessing: false,
      enableBrokerConnections: false,
      enableRiskManagement: false,
      enableWebInterface: false
    });

    // Process command line arguments for backtest parameters
    const backtestRequest = this.parseBacktestRequest();
    
    if (backtestRequest) {
      // Run specific backtest
      await this.runBacktest(backtestRequest);
    } else {
      // Start backtest server mode (for API-driven backtests)
      await this.startBacktestServer();
    }
  }

  private parseBacktestRequest(): BacktestRequest | null {
    const args = process.argv.slice(2);
    
    if (args.length >= 4) {
      return {
        strategyId: args[0],
        startDate: args[1],
        endDate: args[2],
        initialCapital: parseFloat(args[3]),
        instruments: args[4]?.split(',') || [],
        parameters: this.parseParameters(args[5])
      };
    }
    
    return null;
  }

  private async runBacktest(request: BacktestRequest): Promise<void> {
    console.log(`Running backtest for strategy: ${request.strategyId}`);
    
    const backtestEngine = this.app.getComponent('BacktestEngine');
    const results = await backtestEngine.runBacktest(request);
    
    // Output results
    console.log('Backtest Results:');
    console.log(JSON.stringify(results, null, 2));
    
    // Save results to file
    await this.saveResults(request.strategyId, results);
    
    process.exit(0);
  }

  private async startBacktestServer(): Promise<void> {
    console.log('Starting Backtest Server Mode...');
    
    // Enable minimal web server for backtest API
    await this.app.initialize({
      mode: 'BACKTEST_SERVER',
      components: ['BacktestEngine', 'HTTPServer'],
      enableWebInterface: true,
      webServer: {
        port: parseInt(process.env.BACKTEST_PORT || '3001'),
        enableWebSocket: false
      }
    });
    
    await this.app.start();
    console.log('Backtest Server started on port 3001');
  }
}
```

### 3. Development Mode

A special mode for development and testing.

**Entry Point**: `bun run start:dev`

**Purpose**: Development environment with hot reload, mock data, and enhanced debugging.

## Mode Management

### Service Management with systemd

```ini
# /etc/systemd/system/trading-app-live.service
[Unit]
Description=Trading Application Live Service
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
ExecStart=/usr/bin/bun run start:live
ExecStop=/bin/kill -TERM $MAINPID
WorkingDirectory=/opt/trading-app
Restart=always
RestartSec=10
User=trading
Group=trading
Environment=NODE_ENV=production
Environment=LOG_LEVEL=info
StandardOutput=journal
StandardError=journal
TimeoutStopSec=30

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
```

### Docker Compose Integration

```yaml
# docker-compose.yml - Mode-specific services
version: '3.8'

services:
  # Live/Paper Trading Mode
  trading-app-live:
    build: .
    command: bun run start:live
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - APP_MODE=live_trading
      - DEFAULT_EXECUTION_MODE=PAPER
    depends_on:
      - postgres
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
      - ./config:/app/config
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backtesting Mode (on-demand)
  trading-app-backtest:
    build: .
    command: bun run start:backtest
    environment:
      - NODE_ENV=production
      - APP_MODE=backtesting
    depends_on:
      - postgres
    volumes:
      - ./backtest-results:/app/backtest-results
      - ./logs:/app/logs
    restart: "no"  # Backtesting is typically one-off
    profiles:
      - backtest  # Only start when specifically requested

  # Development Mode
  trading-app-dev:
    build: .
    command: bun run start:dev
    ports:
      - "3000:3000"
      - "9229:9229"  # Debug port
    environment:
      - NODE_ENV=development
      - APP_MODE=development
      - LOG_LEVEL=debug
    depends_on:
      - postgres
    volumes:
      - .:/app
      - ./logs:/app/logs
    profiles:
      - dev
```

## Mode-Specific Features

### Live Trading Mode Features

```typescript
// Live trading specific features
interface LiveTradingFeatures {
  // Real-time data processing
  realTimeDataStreams: {
    tickData: boolean;
    orderBook: boolean;
    tradeUpdates: boolean;
  };
  
  // Broker connectivity
  brokerConnections: {
    primary: string;
    backup?: string;
    heartbeatInterval: number;
    reconnectStrategy: 'exponential' | 'linear';
  };
  
  // Risk management
  riskControls: {
    positionLimits: boolean;
    stopLossEnforcement: boolean;
    emergencyStop: boolean;
    portfolioRiskMonitoring: boolean;
  };
  
  // User interface
  webInterface: {
    realTimeCharts: boolean;
    positionMonitoring: boolean;
    strategyControls: boolean;
    riskDashboard: boolean;
  };
  
  // Performance monitoring
  metrics: {
    executionLatency: boolean;
    dataProcessingTime: boolean;
    strategyPerformance: boolean;
    systemHealth: boolean;
  };
}
```

### Backtesting Mode Features

```typescript
// Backtesting specific features
interface BacktestingFeatures {
  // Historical data processing
  historicalData: {
    dateRange: { start: Date; end: Date };
    instruments: string[];
    timeframes: string[];
    dataIntegrity: boolean;
  };
  
  // Virtual trading engine
  virtualTrading: {
    simulatedExecution: boolean;
    reallisticFills: boolean;
    slippageModeling: boolean;
    commissionCalculation: boolean;
  };
  
  // Performance analysis
  analysis: {
    profitFactor: boolean;
    sharpeRatio: boolean;
    maxDrawdown: boolean;
    winRate: boolean;
    tradeAnalysis: boolean;
  };
  
  // Optimization
  optimization: {
    parameterSweeps: boolean;
    geneticAlgorithm: boolean;
    walkForwardAnalysis: boolean;
    monteCarloSimulation: boolean;
  };
  
  // Results export
  export: {
    formats: string[]; // ['json', 'csv', 'excel']
    charts: boolean;
    reports: boolean;
  };
}
```

## Mode Switching and Deployment

### Deployment Scripts

```bash
#!/bin/bash
# deploy_mode.sh - Deploy specific operational mode

MODE=$1
if [ -z "$MODE" ]; then
    echo "Usage: deploy_mode.sh [live|backtest|dev]"
    exit 1
fi

case $MODE in
    "live")
        echo "Deploying Live Trading Mode..."
        docker-compose up -d trading-app-live postgres grafana prometheus
        ;;
    "backtest")
        echo "Deploying Backtesting Mode..."
        docker-compose --profile backtest up trading-app-backtest postgres
        ;;
    "dev")
        echo "Deploying Development Mode..."
        docker-compose --profile dev up trading-app-dev postgres
        ;;
    *)
        echo "Invalid mode: $MODE"
        exit 1
        ;;
esac
```

### Configuration Management

```typescript
// src/config/ConfigFactory.ts
export class ConfigFactory {
  static createConfig(mode: string): ApplicationConfig {
    switch (mode) {
      case 'LIVE_TRADING':
        return new LiveTradingConfig();
      case 'BACKTESTING':
        return new BacktestingConfig();
      case 'DEVELOPMENT':
        return new DevelopmentConfig();
      default:
        throw new Error(`Unknown mode: ${mode}`);
    }
  }
}

// Environment-based mode selection
const appMode = process.env.APP_MODE || 'DEVELOPMENT';
const config = ConfigFactory.createConfig(appMode);
```

## Mode Monitoring and Health Checks

### Health Check Endpoints

```typescript
// Mode-specific health checks
app.get('/health', (req, res) => {
  const health = {
    mode: process.env.APP_MODE,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    components: {}
  };

  // Mode-specific component checks
  if (process.env.APP_MODE === 'LIVE_TRADING') {
    health.components = {
      dataIngestion: this.dataIngestion.isHealthy(),
      brokerConnection: this.brokerManager.isConnected(),
      riskManager: this.riskManager.isActive(),
      strategies: this.strategyManager.getActiveCount()
    };
  } else if (process.env.APP_MODE === 'BACKTESTING') {
    health.components = {
      historicalDataLoader: this.historicalDataLoader.isReady(),
      backtestEngine: this.backtestEngine.isIdle(),
      virtualTradingEngine: this.virtualTradingEngine.isHealthy()
    };
  }

  res.json(health);
});
```

### Mode-Specific Alerts

```yaml
# Mode-specific Prometheus alerts
groups:
  - name: live_trading_alerts
    rules:
      - alert: LiveTradingDataFeedDown
        expr: up{job="trading-api", mode="live"} == 0
        for: 10s
        labels:
          severity: critical
          mode: live_trading
        annotations:
          summary: "Live trading data feed is down"

  - name: backtesting_alerts
    rules:
      - alert: BacktestTimeout
        expr: backtest_duration_seconds > 3600
        for: 0s
        labels:
          severity: warning
          mode: backtesting
        annotations:
          summary: "Backtest running longer than expected"
```

---

## Cross-References

- **Main Architecture**: See [`main-application-architecture.md`](main-application-architecture.md) for overall system design
- **External Operations**: See [`external-operations.md`](external-operations.md) for deployment and maintenance procedures
- **Monitoring**: See [`monitoring-observability.md`](monitoring-observability.md) for mode-specific monitoring
- **Components**: See component files for mode-specific behaviors

---

*This operational mode architecture ensures safe, efficient, and maintainable deployment of different application functionalities with clear separation of concerns and optimized resource utilization.*