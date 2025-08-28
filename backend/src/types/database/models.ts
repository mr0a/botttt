// Database model types for TradeBot application
// These types correspond to the database tables defined in migrations

// Enums that match the database enums
export type InstrumentType = "STOCK" | "INDEX" | "FUTURE" | "OPTION";
export type Exchange = "NSE" | "BSE";
export type TransactionType = "BUY" | "SELL";
export type OptionType = "CALL" | "PUT";
export type OrderStatus =
  | "PENDING"
  | "FILLED"
  | "CANCELLED"
  | "REJECTED"
  | "PARTIAL";
export type PositionStatus = "OPEN" | "CLOSED";
export type ExecutionMode = "PAPER" | "LIVE";

// Base model interface
interface BaseModel {
  created_at: Date;
  updated_at: Date;
}

// Instrument table
export interface Instrument extends BaseModel {
  instrument_id: number;
  symbol: string;
  exchange: Exchange;
  instrument_type: InstrumentType;
  is_active: boolean;
  listing_date?: Date;
  delisting_date?: Date;
}

// Time-series data tables
export interface TickData {
  time: Date;
  instrument_id: number;
  data: Record<string, unknown>; // JSONB data
}

export interface OHLCVCandle {
  time: Date;
  instrument_id: number;
  timeframe: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume: number;
}

export interface OrderBookSnapshot {
  time: Date;
  instrument_id: number;
  bid_prices: number[];
  bid_quantities: number[];
  ask_prices: number[];
  ask_quantities: number[];
  total_bid_quantity?: number;
  total_ask_quantity?: number;
}

// Trading tables
export interface Strategy extends BaseModel {
  strategy_id: string;
  name: string;
  description?: string;
  class_name: string;
  config: Record<string, unknown>; // JSONB config
  is_enabled: boolean;
  execution_mode: ExecutionMode;
}

export interface Position extends BaseModel {
  position_id: string;
  strategy_id: string;
  instrument_id: number;
  quantity: number;
  average_entry_price: number;
  current_price?: number;
  unrealized_pnl?: number;
  realized_pnl: number;
  stop_loss_price?: number;
  target_price?: number;
  status: PositionStatus;
  opened_at: Date;
  closed_at?: Date;
}

export interface InstrumentOrder extends BaseModel {
  order_id: string;
  strategy_id: string;
  instrument_id: number;
  transaction_type: TransactionType;
  quantity: number;
  price?: number;
  order_kind: string;
  current_status: OrderStatus;
  broker_order_id?: string;
  filled_quantity: number;
  average_price?: number;
  executed_at?: Date;
  cancelled_at?: Date;
}

export interface OrderHistory {
  order_history_id: string;
  order_id: string;
  status: OrderStatus;
  timestamp: Date;
  details?: Record<string, unknown>; // JSONB details
}

// Broker credentials
export interface BrokerCredentials extends BaseModel {
  id: number;
  broker_name: string;
  encrypted_api_key: Buffer;
  encrypted_secret: Buffer;
  encryption_key_id: string;
  config: Record<string, unknown>; // JSONB config
}

// Instrument type specific tables
export interface Stock extends BaseModel {
  stock_id: number;
  instrument_id: number;
  isin?: string;
  sector?: string;
  industry?: string;
  market_cap?: number;
  face_value?: number;
  lot_size?: number;
  tick_size?: number;
}

export interface Index extends BaseModel {
  index_id: number;
  instrument_id: number;
  index_type?: string;
  base_year?: number;
  base_value?: number;
  constituents_count?: number;
  methodology?: string;
}

export interface Option extends BaseModel {
  option_id: number;
  instrument_id: number;
  underlying_instrument_id: number;
  option_type: OptionType;
  strike_price: number;
  expiry_date: Date;
  lot_size: number;
  tick_size?: number;
}

export interface Future extends BaseModel {
  future_id: number;
  instrument_id: number;
  underlying_instrument_id?: number;
  expiry_date: Date;
  lot_size: number;
  tick_size?: number;
  margin_percentage?: number;
}

export interface OpenInterest extends BaseModel {
  time: Date;
  instrument_id: number;
  open_interest: number;
  change_in_oi?: number;
  percentage_change?: number;
}

export interface DailyOHLCV extends BaseModel {
  date: Date;
  instrument_id: number;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume: number;
  turnover?: number;
  trades_count?: number;
  delivery_quantity?: number;
  delivery_percentage?: number;
}

export interface IndexConstituent extends BaseModel {
  index_constituent_id: number;
  index_instrument_id: number;
  constituent_instrument_id: number;
  weightage: number;
  shares_outstanding?: number;
  effective_date: Date;
  end_date?: Date;
}

// Query result types for common joins
export interface InstrumentWithDetails extends Instrument {
  stock?: Stock;
  index?: Index;
  option?: Option;
  future?: Future;
}

export interface PositionWithInstrument extends Position {
  instrument: Instrument;
  strategy: Strategy;
}

export interface OrderWithInstrument extends InstrumentOrder {
  instrument: Instrument;
  strategy: Strategy;
}

// Data transfer objects for API responses
export interface CreateInstrumentDTO {
  symbol: string;
  exchange: Exchange;
  instrument_type: InstrumentType;
  is_active?: boolean;
  listing_date?: Date;
  delisting_date?: Date;
}

export interface CreateStrategyDTO {
  strategy_id: string;
  name: string;
  description?: string;
  class_name: string;
  config: Record<string, unknown>;
  is_enabled?: boolean;
  execution_mode?: ExecutionMode;
}

export interface CreateOrderDTO {
  strategy_id: string;
  instrument_id: number;
  transaction_type: TransactionType;
  quantity: number;
  price?: number;
  order_kind: string;
}

export interface CreatePositionDTO {
  strategy_id: string;
  instrument_id: number;
  quantity: number;
  average_entry_price: number;
  stop_loss_price?: number;
  target_price?: number;
}

// Pagination and filtering types
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface InstrumentFilters extends Record<string, unknown> {
  exchange?: Exchange;
  instrument_type?: InstrumentType;
  is_active?: boolean;
  symbol_like?: string;
}

export interface OrderFilters extends Record<string, unknown> {
  strategy_id?: string;
  instrument_id?: number;
  current_status?: OrderStatus;
  date_from?: Date;
  date_to?: Date;
}

export interface PositionFilters extends Record<string, unknown> {
  strategy_id?: string;
  instrument_id?: number;
  status?: PositionStatus;
}

// Market data query types
export interface OHLCVQuery {
  instrument_id: number;
  timeframe: string;
  start_time?: Date;
  end_time?: Date;
  limit?: number;
}

export interface TickDataQuery {
  instrument_id: number;
  start_time?: Date;
  end_time?: Date;
  limit?: number;
}
