# Data Ingestion Module Component

## Realtime Analysis and Trading Application

### Document Information
- **Version**: 1.2
- **Date**: July 21, 2025
- **Author**: Technical Architect
- **Status**: Updated Draft

---

## Component Overview

**Responsibility**: Collect, normalize, and distribute real-time market data from brokers.

The Data Ingestion Module serves as the critical entry point for all market data into the trading system. It manages multi-broker WebSocket connections, transforms raw broker data into standardized formats, and distributes processed data to analysis engines and strategies.

## Key Features

- Multi-broker WebSocket connection management
- **Separate Broker Client Interaction Classes**: Dedicated classes (e.g., `ZerodhaClient`, `FyersClient`) implementing an application-defined interface will handle direct communication with broker APIs to retrieve data
- **DataTransformer Class**: Converts raw broker-specific data formats into a standardized, application-compliant data format
- Data validation and normalization
- **Tick Persister**: Batches incoming tick data and efficiently saves it to the `tick_data` table in TimescaleDB
- Real-time data distribution via internal event emitters to the Analysis Engine and Strategies
- Automatic reconnection and error handling for data feeds
- **Abstraction of External Services**: Utilizes clear interfaces for broker interactions to minimize impact of external API changes

## Performance Optimizations

- Native Bun WebSocket connections for broker APIs
- Batch processing for database writes using Bun's async I/O
- In-memory buffering using native JavaScript Maps and Sets
- Zero-copy data structures for tick data

## Component Interface

```typescript
interface DataIngestionService {
  // Broker connection management
  connectBroker(config: BrokerConfig): Promise<void>;
  disconnectBroker(brokerId: string): Promise<void>;
  
  // Data processing
  processTickData(data: RawBrokerTickData): void; // Raw broker data input
  processOrderBook(data: RawBrokerOrderBookData): void;
  processOrderUpdate(data: RawBrokerData): void;
  processAcknowledgement(data: RawBrokerData): void;
  
  // Health monitoring
  getConnectionStatus(): BrokerStatus[];
  getDataLatency(): LatencyMetrics;
}

// Example DataTransformer interface
interface IDataTransformer {
  transformTick(brokerTick: any): ApplicationTickData;
  transformOrderBook(brokerOrderBook: any): ApplicationOrderBookData;
  transformOrderUpdates(brokerOrderUpdate: any): ApplicationOrderUpdateData;
  transformAcknowledgement(brokerAcknowledgement: any): ApplicationAcknowledgement;
}
```

## Broker Client Architecture

### Broker Interface Definition

```typescript
interface IBrokerClient {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Data subscriptions
  subscribeToTicks(instruments: string[]): Promise<void>;
  subscribeToOrderBook(instruments: string[], depth?: number): Promise<void>;
  unsubscribe(instruments: string[]): Promise<void>;
  
  // Authentication
  authenticate(credentials: BrokerCredentials): Promise<void>;
  refreshToken(): Promise<void>;
  
  // Health checks
  ping(): Promise<boolean>;
  getLatency(): number;
}
```

### Broker-Specific Implementations

```typescript
// Zerodha broker client implementation
class ZerodhaClient implements IBrokerClient {
  private websocket: WebSocket | null = null;
  private credentials: ZerodhaCredentials;
  private dataTransformer: ZerodhaDataTransformer;
  
  constructor(credentials: ZerodhaCredentials) {
    this.credentials = credentials;
    this.dataTransformer = new ZerodhaDataTransformer();
  }
  
  async connect(): Promise<void> {
    // Zerodha-specific connection logic
    const wsUrl = `wss://ws.zerodha.com/?api_key=${this.credentials.apiKey}&access_token=${this.credentials.accessToken}`;
    this.websocket = new WebSocket(wsUrl);
    
    this.websocket.onmessage = (event) => {
      const rawData = JSON.parse(event.data);
      const transformedData = this.dataTransformer.transformTick(rawData);
      this.emit('tick', transformedData);
    };
  }
  
  async subscribeToTicks(instruments: string[]): Promise<void> {
    // Zerodha-specific subscription format
    const subscriptionMessage = {
      a: 'subscribe',
      v: instruments.map(inst => this.getZerodhaInstrumentToken(inst))
    };
    this.websocket?.send(JSON.stringify(subscriptionMessage));
  }
  
  private getZerodhaInstrumentToken(symbol: string): number {
    // Convert application symbol to Zerodha instrument token
    return this.symbolToTokenMapping[symbol];
  }
}

// Fyers broker client implementation
class FyersClient implements IBrokerClient {
  private websocket: WebSocket | null = null;
  private credentials: FyersCredentials;
  private dataTransformer: FyersDataTransformer;
  
  async connect(): Promise<void> {
    // Fyers-specific connection logic
    const wsUrl = `wss://api.fyers.in/socket/v2/dataSock?access_token=${this.credentials.accessToken}`;
    // ... implementation
  }
  
  async subscribeToTicks(instruments: string[]): Promise<void> {
    // Fyers-specific subscription format
    const subscriptionMessage = {
      T: 'SUB_L1',
      L1_LIST: instruments.map(inst => `NSE:${inst}-EQ`)
    };
    this.websocket?.send(JSON.stringify(subscriptionMessage));
  }
}
```

## Data Transformation Layer

### Standardized Data Formats

```typescript
// Application-standard tick data format
interface ApplicationTickData {
  timestamp: Date;
  instrumentId: string;
  price: number;
  quantity: number;
  tradeId?: string;
  exchange: string;
  side?: 'BUY' | 'SELL';
}

// Application-standard order book format
interface ApplicationOrderBookData {
  timestamp: Date;
  instrumentId: string;
  bids: Array<{ price: number; quantity: number }>;
  asks: Array<{ price: number; quantity: number }>;
  totalBidQuantity: number;
  totalAskQuantity: number;
}
```

### Data Transformer Implementations

```typescript
class ZerodhaDataTransformer implements IDataTransformer {
  transformTick(brokerTick: any): ApplicationTickData {
    // Zerodha tick format: [instrument_token, last_price, volume, ...]
    return {
      timestamp: new Date(),
      instrumentId: this.tokenToSymbol(brokerTick.instrument_token),
      price: brokerTick.last_price,
      quantity: brokerTick.volume,
      exchange: 'NSE', // Zerodha specific
      tradeId: brokerTick.last_trade_time?.toString()
    };
  }
  
  transformOrderBook(brokerOrderBook: any): ApplicationOrderBookData {
    return {
      timestamp: new Date(),
      instrumentId: this.tokenToSymbol(brokerOrderBook.instrument_token),
      bids: brokerOrderBook.depth.buy.map((bid: any) => ({
        price: bid.price,
        quantity: bid.quantity
      })),
      asks: brokerOrderBook.depth.sell.map((ask: any) => ({
        price: ask.price,
        quantity: ask.quantity
      })),
      totalBidQuantity: brokerOrderBook.depth.buy.reduce((sum: number, bid: any) => sum + bid.quantity, 0),
      totalAskQuantity: brokerOrderBook.depth.sell.reduce((sum: number, ask: any) => sum + ask.quantity, 0)
    };
  }
}

class FyersDataTransformer implements IDataTransformer {
  transformTick(brokerTick: any): ApplicationTickData {
    // Fyers tick format: {symbol, ltp, vol_traded_today, ...}
    return {
      timestamp: new Date(brokerTick.timestamp * 1000),
      instrumentId: this.extractSymbol(brokerTick.symbol),
      price: brokerTick.ltp,
      quantity: brokerTick.vol_traded_today,
      exchange: 'NSE',
      side: brokerTick.last_traded_qty > 0 ? 'BUY' : 'SELL'
    };
  }
}
```

## Data Processing Pipeline

### High-Performance Processing

```typescript
class DataProcessingPipeline {
  private tickBuffer: Map<string, ApplicationTickData[]> = new Map();
  private batchSize = 100;
  private flushInterval = 1000; // 1 second
  private eventEmitter = new EventTarget();
  
  async processTick(tick: ApplicationTickData): Promise<void> {
    // 1. Buffer tick data in native Map (< 0.1ms)
    const instrument = tick.instrumentId;
    const buffer = this.tickBuffer.get(instrument) ?? [];
    buffer.push(tick);
    this.tickBuffer.set(instrument, buffer);
    
    // 2. Emit real-time event for immediate processing (< 1ms)
    this.eventEmitter.dispatchEvent(new CustomEvent('tick', { detail: tick }));
    
    // 3. Batch flush to database when buffer is full
    if (buffer.length >= this.batchSize) {
      await this.flushTicksToDatabase(instrument, buffer);
      this.tickBuffer.set(instrument, []);
    }
  }
  
  private async flushTicksToDatabase(instrument: string, ticks: ApplicationTickData[]): Promise<void> {
    // Batch insert using prepared statement
    const query = `
      INSERT INTO tick_data (time, instrument_id, price, quantity, trade_id, exchange)
      VALUES ${ticks.map(() => '(?, ?, ?, ?, ?, ?)').join(', ')}
    `;
    
    const params = ticks.flatMap(tick => [
      tick.timestamp,
      this.getInstrumentId(tick.instrumentId),
      tick.price,
      tick.quantity,
      tick.tradeId,
      tick.exchange
    ]);
    
    await this.database.execute(query, params);
  }
}
```

## Connection Management

### WebSocket Connection Handling

```typescript
class BrokerConnectionManager {
  private connections: Map<string, IBrokerClient> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000; // 1 second
  
  async connectBroker(brokerId: string, config: BrokerConfig): Promise<void> {
    const client = this.createBrokerClient(brokerId, config);
    
    try {
      await client.connect();
      this.connections.set(brokerId, client);
      this.reconnectAttempts.set(brokerId, 0);
      
      // Set up connection monitoring
      this.setupConnectionMonitoring(brokerId, client);
      
      console.log(`Successfully connected to broker: ${brokerId}`);
    } catch (error) {
      console.error(`Failed to connect to broker ${brokerId}:`, error);
      await this.scheduleReconnection(brokerId, config);
    }
  }
  
  private setupConnectionMonitoring(brokerId: string, client: IBrokerClient): void {
    // Ping broker every 30 seconds
    const pingInterval = setInterval(async () => {
      try {
        const isAlive = await client.ping();
        if (!isAlive) {
          console.warn(`Broker ${brokerId} ping failed, reconnecting...`);
          await this.reconnectBroker(brokerId);
        }
      } catch (error) {
        console.error(`Ping failed for broker ${brokerId}:`, error);
        await this.reconnectBroker(brokerId);
      }
    }, 30000);
    
    // Store interval reference for cleanup
    this.connectionIntervals.set(brokerId, pingInterval);
  }
  
  private async scheduleReconnection(brokerId: string, config: BrokerConfig): Promise<void> {
    const attempts = this.reconnectAttempts.get(brokerId) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for broker ${brokerId}`);
      return;
    }
    
    const delay = this.baseReconnectDelay * Math.pow(2, attempts); // Exponential backoff
    this.reconnectAttempts.set(brokerId, attempts + 1);
    
    setTimeout(() => {
      this.connectBroker(brokerId, config);
    }, delay);
  }
}
```

## Error Handling & Recovery

### Connection Recovery Strategy

```typescript
class DataIngestionErrorHandler {
  async handleConnectionError(brokerId: string, error: Error): Promise<void> {
    console.error(`Connection error for broker ${brokerId}:`, error);
    
    // Log error for monitoring
    await this.logError('CONNECTION_ERROR', { brokerId, error: error.message });
    
    // Attempt reconnection
    await this.connectionManager.reconnectBroker(brokerId);
    
    // Notify risk manager of data feed issue
    this.eventEmitter.emit('broker_connection_lost', { brokerId, timestamp: new Date() });
  }
  
  async handleDataError(brokerId: string, rawData: any, error: Error): Promise<void> {
    console.error(`Data processing error for broker ${brokerId}:`, error);
    
    // Log error with data sample for debugging
    await this.logError('DATA_PROCESSING_ERROR', {
      brokerId,
      error: error.message,
      dataSample: JSON.stringify(rawData).substring(0, 500)
    });
    
    // Continue processing other data
  }
}
```

## Performance Monitoring

### Latency Tracking

```typescript
class DataIngestionMetrics {
  private latencyBuffer: number[] = [];
  private throughputCounter = 0;
  private lastThroughputReset = Date.now();
  
  recordTickLatency(receivedAt: Date, processedAt: Date): void {
    const latency = processedAt.getTime() - receivedAt.getTime();
    this.latencyBuffer.push(latency);
    
    // Keep only last 1000 measurements
    if (this.latencyBuffer.length > 1000) {
      this.latencyBuffer.shift();
    }
  }
  
  recordThroughput(): void {
    this.throughputCounter++;
  }
  
  getMetrics(): DataIngestionMetrics {
    const avgLatency = this.latencyBuffer.reduce((sum, val) => sum + val, 0) / this.latencyBuffer.length;
    const p95Latency = this.calculatePercentile(this.latencyBuffer, 95);
    
    const now = Date.now();
    const timeElapsed = (now - this.lastThroughputReset) / 1000; // seconds
    const throughputPerSecond = this.throughputCounter / timeElapsed;
    
    return {
      averageLatency: avgLatency,
      p95Latency: p95Latency,
      throughputPerSecond: throughputPerSecond,
      activeConnections: this.connectionManager.getActiveConnectionCount()
    };
  }
}
```

---

## Cross-References

- **Main Architecture**: See [`main-application-architecture.md`](../main-application-architecture.md) for system integration
- **Broker Manager**: See [`broker-manager-module.md`](broker-manager-module.md) for broker interface details
- **Analysis Engine**: See [`analysis-engine-module.md`](analysis-engine-module.md) for data consumption patterns
- **Database Schema**: See [`database-schema.md`](../database-schema.md) for tick data storage

---

*This component serves as the critical data foundation for all trading and analysis operations in the system.*