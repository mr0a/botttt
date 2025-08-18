# API Server & WebSocket Specifications

## Realtime Analysis and Trading Application

### Document Information
- **Version**: 1.2
- **Date**: July 21, 2025
- **Author**: Technical Architect
- **Status**: Updated Draft

---

## API Architecture Overview

The application provides a comprehensive REST API and WebSocket interface for real-time trading operations, market data streaming, and strategy management. Built on ElysiaJS framework with Bun runtime for optimal performance.

### API Technology Stack

- **HTTP Framework**: ElysiaJS (built for Bun)
- **WebSocket**: Bun Native WebSocket
- **Authentication**: JWT tokens with optional MFA
- **Rate Limiting**: Built-in request throttling
- **Validation**: Type-safe request/response validation
- **Documentation**: OpenAPI/Swagger integration

## REST API Endpoints

### Authentication & Authorization

```typescript
// Authentication endpoints
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/profile
POST /api/auth/refresh
POST /api/auth/setup-mfa    // Optional MFA setup
POST /api/auth/verify-mfa   // MFA verification
```

#### Login Request/Response

```typescript
// POST /api/auth/login
interface LoginRequest {
  username: string;
  password: string;
  mfa_token?: string; // Optional MFA token
}

interface LoginResponse {
  success: boolean;
  token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    username: string;
    roles: string[];
  };
  mfa_required?: boolean;
}
```

### Strategy Management

```typescript
// Strategy CRUD operations
GET    /api/strategies              // List all strategies
GET    /api/strategies/:id          // Get strategy details
POST   /api/strategies/:id/enable   // Enable strategy
POST   /api/strategies/:id/disable  // Disable strategy
PUT    /api/strategies/:id/config   // Update strategy configuration
GET    /api/strategies/:id/performance // Get strategy performance metrics
POST   /api/strategies/:id/backtest // Initiate backtest
GET    /api/strategies/:id/positions // Get strategy positions
```

#### Strategy Configuration

```typescript
interface StrategyConfig {
  id: string;
  name: string;
  description?: string;
  parameters: Record<string, any>;
  instruments: string[];
  execution_mode: 'LIVE' | 'PAPER';
  risk_parameters: {
    max_position_size: number;
    stop_loss_percent: number;
    max_daily_loss: number;
  };
  schedule?: {
    start_time: string;
    end_time: string;
    days_of_week: number[];
  };
}

// PUT /api/strategies/:id/config
interface UpdateStrategyRequest {
  config: Partial<StrategyConfig>;
}
```

### Market Data

```typescript
// Market data endpoints
GET /api/instruments                    // List available instruments
GET /api/market-data/:instrument/candles // Get OHLC data for charts and analysis
GET /api/market-data/:instrument/ticks   // Get tick data for detailed analysis
GET /api/market-data/:instrument/depth   // Get order book data for visualization
GET /api/market-data/:instrument/stats   // Get market statistics
```

#### Market Data Queries

```typescript
// GET /api/market-data/:instrument/candles
interface CandleRequest {
  timeframe: '1s' | '5s' | '1m' | '5m' | '15m' | '1h' | '1d';
  from: string; // ISO timestamp
  to: string;   // ISO timestamp
  limit?: number;
}

interface CandleResponse {
  instrument: string;
  timeframe: string;
  data: Array<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    vwap?: number;
  }>;
}

// GET /api/market-data/:instrument/depth
interface OrderBookResponse {
  instrument: string;
  timestamp: string;
  bids: Array<{ price: number; quantity: number }>;
  asks: Array<{ price: number; quantity: number }>;
  spread: number;
  mid_price: number;
}
```

### Trading Operations

```typescript
// Trading endpoints
GET    /api/orders                  // List orders
POST   /api/orders                  // Place new order
PUT    /api/orders/:id              // Modify order
DELETE /api/orders/:id              // Cancel order
GET    /api/positions               // Get current positions
POST   /api/positions/:id/close     // Close position
GET    /api/trades                  // Get trade history
```

#### Order Management

```typescript
// POST /api/orders
interface OrderRequest {
  strategy_id: string;
  instrument: string;
  order_type: 'BUY' | 'SELL';
  quantity: number;
  order_kind: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'STOP_LIMIT';
  price?: number;
  stop_price?: number;
  time_in_force?: 'DAY' | 'GTC' | 'IOC' | 'FOK';
  execution_mode: 'LIVE' | 'PAPER';
}

interface OrderResponse {
  order_id: string;
  status: 'PENDING' | 'SUBMITTED' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'REJECTED';
  broker_order_id?: string;
  filled_quantity: number;
  average_price?: number;
  created_at: string;
  updated_at: string;
}

// GET /api/positions
interface PositionResponse {
  positions: Array<{
    id: string;
    strategy_id: string;
    instrument: string;
    quantity: number;
    average_entry_price: number;
    current_price: number;
    unrealized_pnl: number;
    realized_pnl: number;
    stop_loss_price?: number;
    target_price?: number;
    opened_at: string;
  }>;
}
```

### Risk Management

```typescript
// Risk management endpoints
GET /api/risk/portfolio             // Get portfolio risk metrics
GET /api/risk/positions             // Get position risk analysis
POST /api/risk/emergency-stop       // Emergency stop all trading
PUT /api/risk/limits                // Update risk limits
GET /api/risk/alerts                // Get active risk alerts
```

## WebSocket API Events

### Connection Management

```typescript
// WebSocket connection URL
const wsUrl = `ws://localhost:3000/ws?token=${authToken}`;

// Connection lifecycle events
interface WSConnectionEvent {
  type: 'connected' | 'disconnected' | 'error' | 'reconnecting';
  timestamp: string;
  data?: any;
}
```

### Market Data Streams

```typescript
// Subscribe to real-time market data
interface SubscribeMessage {
  type: 'subscribe';
  channel: 'ticks' | 'candles' | 'orderbook' | 'trades';
  instruments: string[];
  parameters?: {
    timeframe?: string; // For candles
    depth?: number;     // For orderbook
  };
}

// Example subscription
const subscribeToTicks = {
  type: 'subscribe',
  channel: 'ticks',
  instruments: ['NIFTY', 'BANKNIFTY']
};

const subscribeToOrderBook = {
  type: 'subscribe',
  channel: 'orderbook',
  instruments: ['NIFTY'],
  parameters: { depth: 5 }
};
```

#### Real-time Data Events

```typescript
// Tick data stream
interface TickEvent {
  type: 'tick';
  data: {
    instrument: string;
    price: number;
    quantity: number;
    timestamp: string;
    trade_id?: string;
  };
}

// Candle data stream
interface CandleEvent {
  type: 'candle';
  data: {
    instrument: string;
    timeframe: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    timestamp: string;
    is_final: boolean; // true if candle is complete
  };
}

// Order book updates
interface OrderBookEvent {
  type: 'orderbook';
  data: {
    instrument: string;
    bids: Array<{ price: number; quantity: number }>;
    asks: Array<{ price: number; quantity: number }>;
    timestamp: string;
  };
}
```

### Trading Updates

```typescript
// Order status updates
interface OrderUpdateEvent {
  type: 'order_update';
  data: {
    order_id: string;
    strategy_id: string;
    status: string;
    filled_quantity: number;
    average_price?: number;
    timestamp: string;
  };
}

// Position updates
interface PositionUpdateEvent {
  type: 'position_update';
  data: {
    position_id: string;
    strategy_id: string;
    instrument: string;
    unrealized_pnl: number;
    current_price: number;
    timestamp: string;
  };
}

// Trade execution confirmations
interface TradeEvent {
  type: 'trade';
  data: {
    trade_id: string;
    order_id: string;
    strategy_id: string;
    instrument: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    timestamp: string;
    execution_mode: 'LIVE' | 'PAPER';
  };
}
```

## Performance & Security Specifications

### Rate Limiting

```typescript
// API rate limits by endpoint type
const rateLimits = {
  authentication: '10/minute',
  market_data: '1000/minute',
  trading: '100/minute',
  strategy_management: '50/minute',
  websocket_connections: '5/minute'
};
```

### WebSocket Connection Limits

```typescript
interface WSConnectionLimits {
  max_connections_per_user: 3;
  max_subscriptions_per_connection: 50;
  heartbeat_interval: 30000; // 30 seconds
  connection_timeout: 300000; // 5 minutes idle
}
```

### Error Handling

```typescript
// Standard API error response
interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

// WebSocket error events
interface WSErrorEvent {
  type: 'error';
  error: {
    code: 'RATE_LIMITED' | 'UNAUTHORIZED' | 'INVALID_SUBSCRIPTION' | 'CONNECTION_LOST';
    message: string;
    timestamp: string;
  };
}
```

---

## Cross-References

- **Main Architecture**: See [`main-application-architecture.md`](main-application-architecture.md) for system overview
- **Database Schema**: See [`database-schema.md`](database-schema.md) for data models
- **Component Specifications**: See individual component files for implementation details
- **Frontend Integration**: See [`frontend-specs.md`](frontend-specs.md) for UI integration patterns

---

*This API specification enables comprehensive interaction with the trading system while maintaining security, performance, and reliability standards.*