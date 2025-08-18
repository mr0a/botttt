# Coding Standards

## Realtime Analysis and Trading Application

### Document Information
- **Version**: 1.0
- **Date**: July 31, 2025
- **Author**: Development Team
- **Status**: Active

---

## Overview

This document defines essential coding standards for the trading application to ensure consistency, maintainability, and performance in a high-stakes financial environment.

## TypeScript Standards

### Type Safety Requirements

```typescript
// ✅ REQUIRED: Strict type definitions for trading data
interface OrderRequest {
  readonly strategy_id: string;
  readonly instrument: string;
  readonly order_type: 'BUY' | 'SELL';
  readonly quantity: number;
  readonly price?: number;
  readonly execution_mode: 'LIVE' | 'PAPER';
}

// ❌ AVOID: Any types in trading logic
const processOrder = (order: any) => { /* ... */ }; // Never use 'any' for financial data

// ✅ REQUIRED: Use type guards for external data
function isValidTick(data: unknown): data is TickData {
  return typeof data === 'object' && 
         data !== null &&
         'price' in data && 
         'timestamp' in data;
}
```

### Error Handling Standards

```typescript
// ✅ REQUIRED: Specific error types for trading operations
class OrderExecutionError extends Error {
  constructor(
    message: string,
    public readonly orderId: string,
    public readonly brokerResponse?: unknown
  ) {
    super(message);
    this.name = 'OrderExecutionError';
  }
}

// ✅ REQUIRED: Result pattern for critical operations
type OrderResult = 
  | { success: true; orderId: string; brokerOrderId: string }
  | { success: false; error: OrderExecutionError };

// ❌ AVOID: Throwing exceptions in hot paths
// ✅ PREFERRED: Return error results for validation
```

## Performance Critical Code

### Memory Management

```typescript
// ✅ REQUIRED: Object pooling for high-frequency data
class TickDataPool {
  private pool: TickData[] = [];
  
  acquire(): TickData {
    return this.pool.pop() || { price: 0, quantity: 0, timestamp: new Date() };
  }
  
  release(tick: TickData): void {
    // Reset object state
    tick.price = 0;
    tick.quantity = 0;
    this.pool.push(tick);
  }
}

// ❌ AVOID: Creating objects in loops
for (const tick of ticks) {
  const processed = { ...tick, normalized: true }; // Creates new object each iteration
}

// ✅ PREFERRED: Reuse objects
const reusableProcessor = { normalized: true };
for (const tick of ticks) {
  Object.assign(reusableProcessor, tick);
  process(reusableProcessor);
}
```

### Data Structure Optimization

```typescript
// ✅ REQUIRED: Use Maps for instrument lookups
const instrumentCache = new Map<string, InstrumentData>();

// ❌ AVOID: Object property lookups in hot paths
const instruments: Record<string, InstrumentData> = {};

// ✅ REQUIRED: Pre-sized arrays for known capacity
const priceBuffer = new Array(1000); // Pre-allocate for 1000 prices
let bufferIndex = 0;
```

## Async/Await Patterns

### Database Operations

```typescript
// ✅ REQUIRED: Batch database operations
async function saveTicksBatch(ticks: TickData[]): Promise<void> {
  const query = `INSERT INTO tick_data (time, instrument_id, price, quantity) VALUES ${
    ticks.map(() => '(?, ?, ?, ?)').join(', ')
  }`;
  
  const params = ticks.flatMap(tick => [
    tick.timestamp, tick.instrumentId, tick.price, tick.quantity
  ]);
  
  await db.execute(query, params);
}

// ❌ AVOID: Individual database calls in loops
for (const tick of ticks) {
  await db.insert('tick_data', tick); // Creates N database calls
}
```

### Event Processing

```typescript
// ✅ REQUIRED: Non-blocking event processing
class EventProcessor {
  private queue: Event[] = [];
  private processing = false;
  
  async processEvent(event: Event): Promise<void> {
    this.queue.push(event);
    
    if (!this.processing) {
      this.processing = true;
      // Process asynchronously without blocking caller
      setImmediate(() => this.drainQueue());
    }
  }
  
  private async drainQueue(): Promise<void> {
    while (this.queue.length > 0) {
      const event = this.queue.shift()!;
      try {
        await this.handleEvent(event);
      } catch (error) {
        this.logger.error('Event processing failed', { event, error });
      }
    }
    this.processing = false;
  }
}
```

## Logging Standards

### Structured Logging

```typescript
// ✅ REQUIRED: Structured logging for trading events
logger.info('Order placed', {
  event: 'ORDER_PLACED',
  orderId: order.id,
  strategyId: order.strategy_id,
  instrument: order.instrument,
  quantity: order.quantity,
  executionMode: order.execution_mode,
  timestamp: new Date().toISOString()
});

// ❌ AVOID: String concatenation in logs
logger.info(`Order ${order.id} placed for ${order.quantity} ${order.instrument}`);

// ✅ REQUIRED: Log levels for different events
logger.error('Critical trading error', { error, context }); // System failures
logger.warn('Risk threshold exceeded', { riskMetrics });    // Risk alerts
logger.info('Strategy signal generated', { signal });       // Business events
logger.debug('Market data received', { tickData });         // Development only
```

### Performance Logging

```typescript
// ✅ REQUIRED: Performance tracking for critical paths
const startTime = performance.now();
await executeOrder(order);
const executionTime = performance.now() - startTime;

if (executionTime > 300) { // 300ms SLA
  logger.warn('Slow order execution', {
    event: 'SLOW_EXECUTION',
    executionTime,
    orderId: order.id,
    threshold: 300
  });
}
```

## Testing Standards

### Unit Test Requirements

```typescript
// ✅ REQUIRED: Test critical business logic with specific scenarios
describe('PositionManager', () => {
  it('should prevent position size exceeding risk limits', async () => {
    const positionManager = new PositionManager({
      maxPositionSize: 1000,
      maxRiskPercent: 2
    });
    
    const result = await positionManager.validatePosition({
      quantity: 1500, // Exceeds limit
      price: 100,
      stopLoss: 95
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('position size limit');
  });
  
  // ✅ REQUIRED: Test edge cases for financial calculations
  it('should handle zero price edge case', async () => {
    const result = await positionManager.calculatePnL(position, 0);
    expect(result.success).toBe(false);
    expect(result.error).toContain('invalid price');
  });
});
```

### Integration Test Patterns

```typescript
// ✅ REQUIRED: Test with realistic market data
describe('Strategy Integration', () => {
  it('should execute complete trading cycle', async () => {
    const mockBroker = new MockBroker();
    const strategy = new EMACrossoverStrategy(mockBroker);
    
    // Feed realistic tick sequence
    const tickSequence = generateRealisticTicks('NIFTY', 1000);
    
    for (const tick of tickSequence) {
      await strategy.onTick(tick);
    }
    
    const trades = mockBroker.getExecutedTrades();
    expect(trades.length).toBeGreaterThan(0);
    expect(trades.every(trade => trade.price > 0)).toBe(true);
  });
});
```

## Security Standards

### Input Validation

```typescript
// ✅ REQUIRED: Validate all external inputs
function validateOrderRequest(request: unknown): OrderRequest | ValidationError {
  const schema = z.object({
    strategy_id: z.string().min(1).max(100),
    instrument: z.string().regex(/^[A-Z0-9_]+$/),
    order_type: z.enum(['BUY', 'SELL']),
    quantity: z.number().positive().max(100000),
    price: z.number().positive().optional(),
    execution_mode: z.enum(['LIVE', 'PAPER'])
  });
  
  const result = schema.safeParse(request);
  return result.success ? result.data : { error: result.error.message };
}

// ❌ AVOID: Direct property access from external data
const order = {
  strategy_id: req.body.strategy_id, // No validation
  quantity: req.body.quantity        // Could be negative or non-numeric
};
```

### Credential Management

```typescript
// ✅ REQUIRED: Never log sensitive data
class BrokerClient {
  constructor(private credentials: BrokerCredentials) {}
  
  async authenticate(): Promise<void> {
    try {
      await this.broker.login(this.credentials);
      logger.info('Broker authentication successful', { 
        broker: this.credentials.brokerName,
        // ❌ NEVER: apiKey: this.credentials.apiKey
      });
    } catch (error) {
      logger.error('Authentication failed', { 
        broker: this.credentials.brokerName,
        error: error.message // Don't log full error which might contain credentials
      });
    }
  }
}
```

## Code Organization

### Module Structure

```typescript
// ✅ REQUIRED: Clear module boundaries
// src/trading/order-manager.ts
export interface IOrderManager {
  placeOrder(request: OrderRequest): Promise<OrderResult>;
  cancelOrder(orderId: string): Promise<CancelResult>;
}

export class OrderManager implements IOrderManager {
  // Implementation
}

// ✅ REQUIRED: Dependency injection for testability
export class TradingEngine {
  constructor(
    private orderManager: IOrderManager,
    private riskManager: IRiskManager,
    private positionManager: IPositionManager
  ) {}
}

// ❌ AVOID: Direct imports of concrete classes in business logic
import { DatabaseOrderManager } from './database-order-manager';
const orderManager = new DatabaseOrderManager(); // Hard to test
```

### File Naming Conventions

```
src/
├── trading/
│   ├── order-manager.ts         # PascalCase classes
│   ├── position-tracker.ts      # kebab-case files
│   └── risk-calculator.ts       # Clear, descriptive names
├── strategies/
│   ├── ema-crossover.strategy.ts # .strategy suffix for strategies
│   └── support-resistance.strategy.ts
└── brokers/
    ├── zerodha.client.ts        # .client suffix for broker clients
    └── fyers.client.ts
```

## Performance Monitoring

### Metrics Collection

```typescript
// ✅ REQUIRED: Instrument critical code paths
class StrategyExecutor {
  private metrics = new TradingMetrics();
  
  async executeStrategy(strategy: ITradingStrategy, tick: TickData): Promise<void> {
    const startTime = performance.now();
    
    try {
      await strategy.onTick(tick);
      
      const executionTime = performance.now() - startTime;
      this.metrics.recordStrategyExecution(strategy.id, executionTime);
      
      // Alert on slow execution
      if (executionTime > 50) { // 50ms threshold for strategy processing
        this.metrics.recordSlowExecution(strategy.id, executionTime);
      }
      
    } catch (error) {
      this.metrics.recordStrategyError(strategy.id, error);
      throw error;
    }
  }
}
```

## Documentation Requirements

### Code Comments

```typescript
// ✅ REQUIRED: Document complex business logic
/**
 * Calculates position size based on risk percentage and stop loss distance.
 * Uses Kelly Criterion for optimal position sizing in high-frequency scenarios.
 * 
 * @param accountSize - Total account value in INR
 * @param riskPercent - Maximum risk per trade (0.01 = 1%)
 * @param entryPrice - Planned entry price
 * @param stopLoss - Stop loss price
 * @returns Optimal position size in shares/lots
 */
function calculatePositionSize(
  accountSize: number,
  riskPercent: number,
  entryPrice: number,
  stopLoss: number
): number {
  // Kelly Criterion: f = (bp - q) / b
  // Where b = odds, p = probability of win, q = probability of loss
  const riskAmount = accountSize * riskPercent;
  const stopDistance = Math.abs(entryPrice - stopLoss);
  return Math.floor(riskAmount / stopDistance);
}

// ❌ AVOID: Commenting obvious code
// Increment counter by 1
counter++;
```

---

## Enforcement

These standards are enforced through:
- **ESLint configuration** with custom rules for trading-specific patterns
- **Pre-commit hooks** for type checking and formatting
- **Code review checklist** focusing on performance and security
- **Automated testing** requirements for critical trading logic

## Performance Benchmarks

All code must meet these performance targets:
- **Order execution**: < 300ms end-to-end
- **Tick processing**: < 50ms per tick
- **Database operations**: < 100ms for single operations
- **Memory usage**: No memory leaks in 24h continuous operation

---

*These standards ensure code quality, performance, and reliability in the high-stakes trading environment while maintaining developer productivity.*