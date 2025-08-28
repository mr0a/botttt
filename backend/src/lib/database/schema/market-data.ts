import {
  pgTable,
  integer,
  timestamp,
  jsonb,
  decimal,
  bigint,
  varchar,
  primaryKey,
  date,
} from "drizzle-orm/pg-core";
import { instrument } from "./instrument";

// Tick data table
export const tickData = pgTable(
  "tick_data",
  {
    time: timestamp("time", { withTimezone: true }).notNull(),
    instrumentId: integer("instrument_id")
      .notNull()
      .references(() => instrument.instrumentId),
    data: jsonb("data").notNull(),
  },
  (table) => [primaryKey({ columns: [table.time, table.instrumentId] })],
);

// OHLCV candle table
export const ohlcvCandle = pgTable(
  "ohlcv_candle",
  {
    time: timestamp("time", { withTimezone: true }).notNull(),
    instrumentId: integer("instrument_id")
      .notNull()
      .references(() => instrument.instrumentId),
    timeframe: varchar("timeframe", { length: 10 }).notNull(),
    openPrice: decimal("open_price", { precision: 12, scale: 4 }).notNull(),
    highPrice: decimal("high_price", { precision: 12, scale: 4 }).notNull(),
    lowPrice: decimal("low_price", { precision: 12, scale: 4 }).notNull(),
    closePrice: decimal("close_price", { precision: 12, scale: 4 }).notNull(),
    volume: bigint("volume", { mode: "number" }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.time, table.instrumentId, table.timeframe],
    }),
  ],
);

// Order book snapshot table
export const orderBookSnapshot = pgTable(
  "order_book_snapshot",
  {
    time: timestamp("time", { withTimezone: true }).notNull(),
    instrumentId: integer("instrument_id")
      .notNull()
      .references(() => instrument.instrumentId),
    bidPrices: decimal("bid_prices", { precision: 12, scale: 4 })
      .array()
      .notNull(),
    bidQuantities: integer("bid_quantities").array().notNull(),
    askPrices: decimal("ask_prices", { precision: 12, scale: 4 })
      .array()
      .notNull(),
    askQuantities: integer("ask_quantities").array().notNull(),
    totalBidQuantity: bigint("total_bid_quantity", { mode: "number" }),
    totalAskQuantity: bigint("total_ask_quantity", { mode: "number" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.time, table.instrumentId] }),
  }),
);

// Daily OHLCV table
export const dailyOhlcv = pgTable(
  "daily_ohlcv",
  {
    date: date("date").notNull(),
    instrumentId: integer("instrument_id")
      .notNull()
      .references(() => instrument.instrumentId),
    openPrice: decimal("open_price", { precision: 12, scale: 4 }).notNull(),
    highPrice: decimal("high_price", { precision: 12, scale: 4 }).notNull(),
    lowPrice: decimal("low_price", { precision: 12, scale: 4 }).notNull(),
    closePrice: decimal("close_price", { precision: 12, scale: 4 }).notNull(),
    volume: bigint("volume", { mode: "number" }).notNull(),
    turnover: decimal("turnover", { precision: 20, scale: 2 }),
    tradesCount: integer("trades_count"),
    deliveryQuantity: bigint("delivery_quantity", { mode: "number" }),
    deliveryPercentage: decimal("delivery_percentage", {
      precision: 5,
      scale: 2,
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.date, table.instrumentId] })],
);

// Open interest table
export const openInterest = pgTable(
  "open_interest",
  {
    time: timestamp("time", { withTimezone: true }).notNull(),
    instrumentId: integer("instrument_id")
      .notNull()
      .references(() => instrument.instrumentId),
    openInterest: bigint("open_interest", { mode: "number" }).notNull(),
    changeInOi: bigint("change_in_oi", { mode: "number" }),
    percentageChange: decimal("percentage_change", {
      precision: 6,
      scale: 2,
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.time, table.instrumentId] })],
);

export type TickData = typeof tickData.$inferSelect;
export type NewTickData = typeof tickData.$inferInsert;
export type OhlcvCandle = typeof ohlcvCandle.$inferSelect;
export type NewOhlcvCandle = typeof ohlcvCandle.$inferInsert;
export type OrderBookSnapshot = typeof orderBookSnapshot.$inferSelect;
export type NewOrderBookSnapshot = typeof orderBookSnapshot.$inferInsert;
export type DailyOhlcv = typeof dailyOhlcv.$inferSelect;
export type NewDailyOhlcv = typeof dailyOhlcv.$inferInsert;
export type OpenInterest = typeof openInterest.$inferSelect;
export type NewOpenInterest = typeof openInterest.$inferInsert;
