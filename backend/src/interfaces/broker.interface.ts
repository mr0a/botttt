export interface IBrokerService {
  authenticate(credentials: BrokerCredentials): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  placeOrder(order: OrderRequest): Promise<OrderResponse>;
  getPositions(): Promise<Position[]>;
  subscribeToData(instruments: string[]): Promise<void>;
  getAccountInfo(): Promise<AccountInfo>;
}

export interface OrderRequest {
  symbol: string;
  quantity: number;
  orderType: "market" | "limit";
  price?: number; // Optional for market orders
  side: "buy" | "sell";
}

export interface OrderResponse {
  orderId: string;
  status: "filled" | "pending" | "rejected";
}

export interface AccountInfo {
  accountId: string;
  balance: number;
  equity: number;
  margin: number;
  positions: Position[];
}

export interface BrokerCredentials {
  accountId: string;
  apiKey: string;
  apiSecret: string;
  environment: "live" | "paper" | "sandbox";
}
