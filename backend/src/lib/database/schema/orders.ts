import {
  pgTable,
  uuid,
  varchar,
  integer,
  decimal,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { instrument } from "./instrument";
import { transactionTypeEnum } from "./enum";

// Enums
// Instrument order table
export const instrumentOrder = pgTable("order", {
  orderId: uuid("order_id").primaryKey().defaultRandom(),
  strategyId: varchar("strategy_id", { length: 100 }).notNull(),
  instrumentId: integer("instrument_id")
    .notNull()
    .references(() => instrument.instrumentId),
  transactionType: transactionTypeEnum("transaction_type").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 12, scale: 4 }),
  orderKind: varchar("order_kind", { length: 20 }).notNull(),
  currentStatus: varchar("current_status", { length: 20 })
    .notNull()
    .default("PENDING"),
  brokerOrderId: varchar("broker_order_id", { length: 100 }),
  filledQuantity: integer("filled_quantity").default(0),
  averagePrice: decimal("average_price", { precision: 12, scale: 4 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  executedAt: timestamp("executed_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
});

// Order history table
export const orderHistory = pgTable("order_history", {
  orderHistoryId: uuid("order_history_id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => instrumentOrder.orderId),
  status: varchar("status", { length: 20 }).notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .notNull()
    .defaultNow(),
  details: jsonb("details"),
});

export type InstrumentOrder = typeof instrumentOrder.$inferSelect;
export type NewInstrumentOrder = typeof instrumentOrder.$inferInsert;
export type OrderHistory = typeof orderHistory.$inferSelect;
export type NewOrderHistory = typeof orderHistory.$inferInsert;
