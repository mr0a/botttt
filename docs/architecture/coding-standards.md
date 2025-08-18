# Coding Standards
**Version**: 1.0 | **Status**: Active | **Date**: July 2025

## Core Principles
- **Type Safety**: No `any` types, strict interfaces for all trading data
- **Performance**: <50ms tick processing, <300ms order execution
- **Security**: Validate all inputs, never log credentials
- **Reliability**: Structured error handling, comprehensive testing

## TypeScript Standards

### Type Safety & Error Handling
```typescript
// ✅ REQUIRED: Strict interfaces
interface OrderRequest {
  readonly strategy_id: string;
  readonly instrument: string;
  readonly order_type: 'BUY' | 'SELL';
  readonly quantity: number;
  readonly execution_mode: 'LIVE' | 'PAPER';
}

// ✅ REQUIRED: Result pattern for critical operations
type OrderResult =
  | { success: true; orderId: string; brokerOrderId: string }
  | { success: false; error: OrderExecutionError };

// ✅ REQUIRED: Type guards for external data
function isValidTick(data: unknown): data is TickData {
  return typeof data === 'object' && data !== null && 'price' in data;
}
```

## Error Handling & Logging Best Practices

### Global Error Handler Strategy
```typescript
// ✅ REQUIRED: Global error handler as safety net
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  gracefulShutdown();
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled rejection', { reason });
  gracefulShutdown();
});

// ✅ REQUIRED: Custom error types for context
class TradingError extends Error {
  constructor(message: string, public readonly code: string, public readonly context?: unknown) {
    super(message);
    this.name = 'TradingError';
  }
}

// ✅ REQUIRED: Strategic try-catch only for specific recovery
async function executeOrder(order: OrderRequest): Promise<OrderResult> {
  try {
    const result = await broker.placeOrder(order);
    return { success: true, orderId: result.id };
  } catch (error: unknown) {
    // Only catch where local recovery is needed
    if (error instanceof BrokerConnectionError) {
      await reconnectBroker();
      throw new TradingError('Broker reconnection attempted', 'BROKER_RETRY', { orderId: order.id });
    }
    throw error; // Let other errors bubble to global handler
  }
}

// ✅ REQUIRED: Type-safe error handling with unknown
function handleApiError(error: unknown): void {
  if (error instanceof Error) {
    logger.error('API error', { message: error.message, stack: error.stack });
  } else {
    logger.error('Unknown error', { error: String(error) });
  }
}
```

## Performance Requirements

### Memory Management
```typescript
// ✅ REQUIRED: Object pooling for high-frequency data
class TickDataPool {
  private pool: TickData[] = [];
  acquire(): TickData { return this.pool.pop() || createNewTick(); }
  release(tick: TickData): void { this.pool.push(resetTick(tick)); }
}

// ✅ REQUIRED: Use Maps for lookups, pre-sized arrays
const instrumentCache = new Map<string, InstrumentData>();
const priceBuffer = new Array(1000); // Pre-allocate
```

### Database & Event Processing
```typescript
// ✅ REQUIRED: Batch operations
async function saveTicksBatch(ticks: TickData[]): Promise<void> {
  const query = `INSERT INTO tick_data VALUES ${ticks.map(() => '(?, ?, ?, ?)').join(', ')}`;
  await db.execute(query, ticks.flatMap(t => [t.timestamp, t.instrumentId, t.price, t.quantity]));
}

// ✅ REQUIRED: Non-blocking event processing
class EventProcessor {
  private queue: Event[] = [];
  private processing = false;
  
  async processEvent(event: Event): Promise<void> {
    this.queue.push(event);
    if (!this.processing) {
      this.processing = true;
      setImmediate(() => this.drainQueue());
    }
  }
}
```

## Logging Standards
```typescript
// ✅ REQUIRED: Structured logging
logger.info('Order placed', {
  event: 'ORDER_PLACED',
  orderId: order.id,
  instrument: order.instrument,
  executionMode: order.execution_mode
});

// ✅ REQUIRED: Performance tracking
const startTime = performance.now();
await executeOrder(order);
const executionTime = performance.now() - startTime;
if (executionTime > 300) {
  logger.warn('Slow execution', { executionTime, orderId: order.id });
}
```

## Testing Standards
```typescript
// ✅ REQUIRED: Test critical business logic & edge cases
describe('PositionManager', () => {
  it('should prevent exceeding risk limits', async () => {
    const result = await positionManager.validatePosition({ quantity: 1500 });
    expect(result.success).toBe(false);
  });
  
  it('should handle zero price edge case', async () => {
    const result = await positionManager.calculatePnL(position, 0);
    expect(result.error).toContain('invalid price');
  });
});

// ✅ REQUIRED: Integration tests with realistic data
describe('Strategy Integration', () => {
  it('should execute complete trading cycle', async () => {
    const tickSequence = generateRealisticTicks('NIFTY', 1000);
    for (const tick of tickSequence) await strategy.onTick(tick);
    expect(mockBroker.getExecutedTrades().length).toBeGreaterThan(0);
  });
});
```

## Security Standards
```typescript
// ✅ REQUIRED: Input validation with Zod
function validateOrderRequest(request: unknown): OrderRequest | ValidationError {
  const schema = z.object({
    strategy_id: z.string().min(1).max(100),
    instrument: z.string().regex(/^[A-Z0-9_]+$/),
    order_type: z.enum(['BUY', 'SELL']),
    quantity: z.number().positive().max(100000)
  });
  const result = schema.safeParse(request);
  return result.success ? result.data : { error: result.error.message };
}

// ✅ REQUIRED: Never log credentials
logger.info('Authentication successful', {
  broker: credentials.brokerName
  // ❌ NEVER: apiKey: credentials.apiKey
});
```

## Code Organization
```typescript
// ✅ REQUIRED: Clear interfaces & dependency injection
export interface IOrderManager {
  placeOrder(request: OrderRequest): Promise<OrderResult>;
}

export class TradingEngine {
  constructor(
    private orderManager: IOrderManager,
    private riskManager: IRiskManager
  ) {}
}
```

### File Structure
```
src/
├── trading/order-manager.ts         # kebab-case files
├── strategies/ema-crossover.strategy.ts  # .strategy suffix
└── brokers/zerodha.client.ts        # .client suffix
```

## Performance Benchmarks
- **Order execution**: < 300ms end-to-end
- **Tick processing**: < 50ms per tick
- **Database operations**: < 100ms for single ops
- **Memory**: No leaks in 24h operation

## Enforcement
- ESLint with trading-specific rules
- Pre-commit hooks for type checking
- Code review checklist
- Automated testing requirements

---
*Essential standards for reliable, high-performance trading systems*