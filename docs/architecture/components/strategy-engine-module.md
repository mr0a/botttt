# Strategy Engine Module Component

## Realtime Analysis and Trading Application

### Document Information
- **Version**: 1.2
- **Date**: July 21, 2025
- **Author**: Technical Architect
- **Status**: Updated Draft

---

## Component Overview

**Responsibility**: Executes trading strategies and manages their lifecycle.

The Strategy Engine Module is the core component responsible for executing automated trading strategies. It provides a flexible framework for strategy development, execution, backtesting, and performance monitoring while ensuring proper risk management and resource allocation.

## Key Features

- **Strategy Registration**: Strategies will be registered using decorators (e.g., `@Strategy('MyStrategyName')`), allowing the Strategy Manager to discover and load them at runtime
- **Strategy Execution**: Strategies are implemented as normal classes, instantiated and managed by an internal "Strategy Executor." The Executor will handle the lifecycle of strategy instances, providing them with necessary data feeds and interacting with the Trading Engine and Risk Manager
- Configuration management for each strategy, including support for custom timeframes, multiple instruments, and configurable parameters
- Execution scheduling and monitoring
- Backtesting capabilities
- Performance tracking
- **Dynamic Control**: Provides API endpoints to dynamically enable or disable strategies

## Performance Optimizations

- Efficient data access patterns to the shared in-memory data structures
- Configurable execution intervals
- Memory-efficient backtesting engine

## Component Interface

```typescript
interface StrategyManager {
  // Strategy lifecycle
  registerStrategy(strategy: TradingStrategy): void; // Uses decorators for auto-discovery
  enableStrategy(strategyId: string): Promise<void>;
  disableStrategy(strategyId: string): Promise<void>;
  
  // Configuration
  updateStrategyConfig(strategyId: string, config: StrategyConfig): Promise<void>;
  
  // Backtesting
  runBacktest(request: BacktestRequest): Promise<BacktestResult>;
}
```

## Strategy Framework Architecture

### Base Strategy Interface

```typescript
interface ITradingStrategy {
  // Strategy identification
  readonly id: string;
  readonly name: string;
  readonly description: string;
  
  // Lifecycle methods
  initialize(config: StrategyConfig): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  destroy(): Promise<void>;
  
  // Data processing
  onTick(tick: TickData): Promise<void>;
  onCandle(candle: CandleData): Promise<void>;
  onOrderUpdate(update: OrderUpdate): Promise<void>;
  onPositionUpdate(update: PositionUpdate): Promise<void>;
  
  // Strategy logic
  analyzeMarket(marketData: MarketData): Promise<AnalysisResult>;
  generateSignals(analysis: AnalysisResult): Promise<TradingSignal[]>;
  calculatePositionSize(signal: TradingSignal): Promise<number>;
  
  // Risk management
  validateTrade(signal: TradingSignal): Promise<boolean>;
  getStopLoss(position: Position): Promise<number>;
  getTarget(position: Position): Promise<number>;
  shouldExit(position: Position, currentPrice: number): Promise<boolean>;
  
  // Performance tracking
  getPerformanceMetrics(): PerformanceMetrics;
  getState(): StrategyState;
}
```

### Strategy Registration System

```typescript
// Strategy decorator for auto-discovery
function Strategy(name: string, config?: Partial<StrategyConfig>) {
  return function<T extends { new(...args: any[]): ITradingStrategy }>(constructor: T) {
    // Register strategy with the strategy manager
    StrategyRegistry.register(name, constructor, config);
    return constructor;
  };
}

// Example strategy implementation
@Strategy('EMA_Crossover', {
  instruments: ['NIFTY', 'BANKNIFTY'],
  execution_mode: 'PAPER',
  timeframes: ['1m', '5m']
})
class EMACrossoverStrategy implements ITradingStrategy {
  public readonly id = 'ema_crossover';
  public readonly name = 'EMA Crossover Strategy';
  public readonly description = 'Simple EMA crossover with risk management';
  
  private config: EMACrossoverConfig;
  private dataContext: StrategyDataContext;
  private positions: Map<string, Position> = new Map();
  
  async initialize(config: StrategyConfig): Promise<void> {
    this.config = config as EMACrossoverConfig;
    this.dataContext = new StrategyDataContext(config.instruments, config.timeframes);
    
    // Validate configuration
    if (this.config.fastEMA >= this.config.slowEMA) {
      throw new Error('Fast EMA period must be less than slow EMA period');
    }
  }
  
  async onCandle(candle: CandleData): Promise<void> {
    // Update data context with new candle
    this.dataContext.addCandle(candle);
    
    // Calculate EMAs
    const fastEMA = this.dataContext.getEMA(candle.instrument, candle.timeframe, this.config.fastEMA);
    const slowEMA = this.dataContext.getEMA(candle.instrument, candle.timeframe, this.config.slowEMA);
    
    if (!fastEMA || !slowEMA) return; // Not enough data
    
    // Generate signals
    const signals = await this.generateSignals({
      instrument: candle.instrument,
      fastEMA: fastEMA[fastEMA.length - 1],
      slowEMA: slowEMA[slowEMA.length - 1],
      prevFastEMA: fastEMA[fastEMA.length - 2],
      prevSlowEMA: slowEMA[slowEMA.length - 2],
      currentPrice: candle.close
    });
    
    // Execute signals
    for (const signal of signals) {
      await this.executeSignal(signal);
    }
  }
  
  async generateSignals(analysis: any): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];
    
    // Bullish crossover: fast EMA crosses above slow EMA
    if (analysis.prevFastEMA <= analysis.prevSlowEMA && analysis.fastEMA > analysis.slowEMA) {
      const positionSize = await this.calculatePositionSize({
        type: 'BUY',
        instrument: analysis.instrument,
        price: analysis.currentPrice
      });
      
      signals.push({
        type: 'BUY',
        instrument: analysis.instrument,
        quantity: positionSize,
        price: analysis.currentPrice,
        stopLoss: analysis.currentPrice * (1 - this.config.stopLossPercent / 100),
        target: analysis.currentPrice * (1 + this.config.targetPercent / 100),
        strategyId: this.id
      });
    }
    
    // Bearish crossover: fast EMA crosses below slow EMA
    if (analysis.prevFastEMA >= analysis.prevSlowEMA && analysis.fastEMA < analysis.slowEMA) {
      // Close existing long positions
      const existingPosition = this.positions.get(analysis.instrument);
      if (existingPosition && existingPosition.quantity > 0) {
        signals.push({
          type: 'SELL',
          instrument: analysis.instrument,
          quantity: existingPosition.quantity,
          price: analysis.currentPrice,
          strategyId: this.id,
          action: 'CLOSE_POSITION'
        });
      }
    }
    
    return signals;
  }
  
  async calculatePositionSize(signal: TradingSignal): Promise<number> {
    const riskAmount = this.config.accountSize * (this.config.riskPercent / 100);
    const stopLossDistance = Math.abs(signal.price - signal.stopLoss);
    const positionSize = Math.floor(riskAmount / stopLossDistance);
    
    // Apply maximum position size limit
    return Math.min(positionSize, this.config.maxPositionSize);
  }
}
```

## Strategy Execution Engine

### Strategy Executor

```typescript
class StrategyExecutor {
  private activeStrategies: Map<string, ITradingStrategy> = new Map();
  private strategyStates: Map<string, StrategyState> = new Map();
  private dataSubscriptions: Map<string, DataSubscription[]> = new Map();
  
  async enableStrategy(strategyId: string): Promise<void> {
    const strategyClass = StrategyRegistry.getStrategy(strategyId);
    if (!strategyClass) {
      throw new Error(`Strategy not found: ${strategyId}`);
    }
    
    // Create strategy instance
    const strategy = new strategyClass();
    
    // Load configuration from database
    const config = await this.loadStrategyConfig(strategyId);
    
    // Initialize strategy
    await strategy.initialize(config);
    
    // Set up data subscriptions
    await this.setupDataSubscriptions(strategy, config);
    
    // Start strategy
    await strategy.start();
    
    // Track active strategy
    this.activeStrategies.set(strategyId, strategy);
    this.strategyStates.set(strategyId, {
      status: 'RUNNING',
      startTime: new Date(),
      lastUpdate: new Date()
    });
    
    console.log(`Strategy enabled: ${strategyId}`);
  }
  
  async disableStrategy(strategyId: string): Promise<void> {
    const strategy = this.activeStrategies.get(strategyId);
    if (!strategy) {
      throw new Error(`Strategy not active: ${strategyId}`);
    }
    
    // Stop strategy
    await strategy.stop();
    
    // Clean up data subscriptions
    await this.cleanupDataSubscriptions(strategyId);
    
    // Remove from active strategies
    this.activeStrategies.delete(strategyId);
    this.strategyStates.set(strategyId, {
      status: 'STOPPED',
      stopTime: new Date()
    });
    
    console.log(`Strategy disabled: ${strategyId}`);
  }
  
  private async setupDataSubscriptions(strategy: ITradingStrategy, config: StrategyConfig): Promise<void> {
    const subscriptions: DataSubscription[] = [];
    
    // Subscribe to tick data for required instruments
    for (const instrument of config.instruments) {
      const tickSubscription = this.dataManager.subscribeToTicks(instrument, (tick) => {
        strategy.onTick(tick);
      });
      subscriptions.push(tickSubscription);
      
      // Subscribe to candle data for required timeframes
      for (const timeframe of config.timeframes) {
        const candleSubscription = this.dataManager.subscribeToCandles(instrument, timeframe, (candle) => {
          strategy.onCandle(candle);
        });
        subscriptions.push(candleSubscription);
      }
    }
    
    this.dataSubscriptions.set(strategy.id, subscriptions);
  }
}
```

## Strategy Data Context

### Market Data Access Layer

```typescript
class StrategyDataContext {
  private instruments: string[];
  private timeframes: string[];
  private candleCache: Map<string, CandleData[]> = new Map();
  private indicatorCache: Map<string, IndicatorData> = new Map();
  
  constructor(instruments: string[], timeframes: string[]) {
    this.instruments = instruments;
    this.timeframes = timeframes;
  }
  
  addCandle(candle: CandleData): void {
    const key = `${candle.instrument}_${candle.timeframe}`;
    const candles = this.candleCache.get(key) || [];
    candles.push(candle);
    
    // Keep only last 1000 candles for performance
    if (candles.length > 1000) {
      candles.shift();
    }
    
    this.candleCache.set(key, candles);
    
    // Update indicators
    this.updateIndicators(candle.instrument, candle.timeframe, candles);
  }
  
  getCandles(instrument: string, timeframe: string, count?: number): CandleData[] {
    const key = `${instrument}_${timeframe}`;
    const candles = this.candleCache.get(key) || [];
    
    if (count) {
      return candles.slice(-count);
    }
    return candles;
  }
  
  getEMA(instrument: string, timeframe: string, period: number): number[] | null {
    const key = `${instrument}_${timeframe}_EMA_${period}`;
    const indicator = this.indicatorCache.get(key);
    return indicator?.values || null;
  }
  
  getRSI(instrument: string, timeframe: string, period: number): number[] | null {
    const key = `${instrument}_${timeframe}_RSI_${period}`;
    const indicator = this.indicatorCache.get(key);
    return indicator?.values || null;
  }
  
  private updateIndicators(instrument: string, timeframe: string, candles: CandleData[]): void {
    const prices = candles.map(c => c.close);
    
    // Update EMA indicators
    for (const period of [9, 21, 50, 200]) {
      if (prices.length >= period) {
        const ema = this.calculateEMA(prices, period);
        const key = `${instrument}_${timeframe}_EMA_${period}`;
        this.indicatorCache.set(key, { values: ema, lastUpdate: new Date() });
      }
    }
    
    // Update RSI indicators
    for (const period of [14, 21]) {
      if (prices.length >= period + 1) {
        const rsi = this.calculateRSI(prices, period);
        const key = `${instrument}_${timeframe}_RSI_${period}`;
        this.indicatorCache.set(key, { values: rsi, lastUpdate: new Date() });
      }
    }
  }
  
  private calculateEMA(prices: number[], period: number): number[] {
    const multiplier = 2 / (period + 1);
    const ema: number[] = [];
    
    // Initialize with SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += prices[i];
    }
    ema[period - 1] = sum / period;
    
    // Calculate EMA
    for (let i = period; i < prices.length; i++) {
      ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
    }
    
    return ema;
  }
  
  private calculateRSI(prices: number[], period: number): number[] {
    const rsi: number[] = [];
    let gains = 0;
    let losses = 0;
    
    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change >= 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    rsi[period] = 100 - (100 / (1 + avgGain / avgLoss));
    
    // Calculate subsequent RSI values
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      const gain = change >= 0 ? change : 0;
      const loss = change < 0 ? -change : 0;
      
      avgGain = ((avgGain * (period - 1)) + gain) / period;
      avgLoss = ((avgLoss * (period - 1)) + loss) / period;
      
      rsi[i] = 100 - (100 / (1 + avgGain / avgLoss));
    }
    
    return rsi;
  }
}
```

## Backtesting Engine

### Historical Data Simulation

```typescript
class BacktestEngine {
  private database: Database;
  private virtualBroker: VirtualBroker;
  
  async runBacktest(request: BacktestRequest): Promise<BacktestResult> {
    // Initialize virtual trading environment
    this.virtualBroker = new VirtualBroker(request.initialCapital);
    
    // Load historical data
    const historicalData = await this.loadHistoricalData(
      request.instruments,
      request.startDate,
      request.endDate
    );
    
    // Create strategy instance
    const strategyClass = StrategyRegistry.getStrategy(request.strategyId);
    const strategy = new strategyClass();
    
    // Initialize strategy with backtest configuration
    await strategy.initialize({
      ...request.parameters,
      executionMode: 'BACKTEST'
    });
    
    // Run simulation
    const results = await this.simulateTrading(strategy, historicalData);
    
    return {
      summary: this.calculateSummaryMetrics(results),
      trades: results.trades,
      equityCurve: results.equityCurve,
      performance: results.performance
    };
  }
  
  private async simulateTrading(strategy: ITradingStrategy, data: HistoricalData[]): Promise<BacktestResults> {
    const trades: Trade[] = [];
    const equityCurve: EquityPoint[] = [];
    
    for (const dataPoint of data) {
      // Simulate candle data for strategy
      await strategy.onCandle(dataPoint);
      
      // Process any generated signals
      const signals = await strategy.getGeneratedSignals();
      
      for (const signal of signals) {
        const trade = await this.virtualBroker.executeSignal(signal);
        if (trade) {
          trades.push(trade);
        }
      }
      
      // Record equity curve
      const currentEquity = this.virtualBroker.getEquity();
      equityCurve.push({
        timestamp: dataPoint.timestamp,
        equity: currentEquity,
        drawdown: this.calculateDrawdown(currentEquity, equityCurve)
      });
    }
    
    return { trades, equityCurve, performance: this.calculatePerformance(trades) };
  }
}
```

## Strategy Performance Monitoring

### Real-time Performance Tracking

```typescript
class StrategyPerformanceTracker {
  private strategyMetrics: Map<string, StrategyMetrics> = new Map();
  
  updatePerformance(strategyId: string, trade: Trade): void {
    const metrics = this.strategyMetrics.get(strategyId) || this.initializeMetrics();
    
    metrics.totalTrades++;
    metrics.totalPnL += trade.pnl;
    
    if (trade.pnl > 0) {
      metrics.winningTrades++;
      metrics.totalWinAmount += trade.pnl;
    } else {
      metrics.losingTrades++;
      metrics.totalLossAmount += Math.abs(trade.pnl);
    }
    
    metrics.winRate = (metrics.winningTrades / metrics.totalTrades) * 100;
    metrics.profitFactor = metrics.totalWinAmount / Math.max(metrics.totalLossAmount, 1);
    metrics.lastUpdate = new Date();
    
    this.strategyMetrics.set(strategyId, metrics);
  }
  
  getPerformanceMetrics(strategyId: string): StrategyMetrics | null {
    return this.strategyMetrics.get(strategyId) || null;
  }
}
```

---

## Cross-References

- **Main Architecture**: See [`main-application-architecture.md`](../main-application-architecture.md) for system integration
- **Trading Engine**: See [`trading-engine-module.md`](trading-engine-module.md) for order execution
- **Analysis Engine**: See [`analysis-engine-module.md`](analysis-engine-module.md) for market data analysis
- **Risk Manager**: See [`risk-manager-module.md`](risk-manager-module.md) for risk management integration

---

*This component enables automated trading strategy execution with comprehensive backtesting, monitoring, and risk management capabilities.*