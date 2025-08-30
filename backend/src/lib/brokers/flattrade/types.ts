export interface FlattradeWebSocketMessage {
  t: string; // message type
  k?: string; // symbol key
  ts?: number; // timestamp
  lp?: string; // last price
  lq?: string; // last quantity
  ap?: string; // ask price
  aq?: string; // ask quantity
  bp?: string; // bid price
  bq?: string; // bid quantity
  oi?: string; // open interest
  v?: string; // volume
  pc?: string; // price change
  ft?: number; // feed time
  e?: string; // exchange
  tk?: string; // token
  ts1?: number; // server timestamp
  ts2?: number; // exchange timestamp
  bids?: Array<[string, string]>; // bid price, quantity
  asks?: Array<[string, string]>; // ask price, quantity
}
