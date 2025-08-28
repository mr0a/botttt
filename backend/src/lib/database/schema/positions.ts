import {
  pgTable,
  uuid,
  varchar,
  integer,
  decimal,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { instrument } from "./instrument";
import { executionModeEnum, positionStatusEnum } from "./enum";

// Strategy table
export const strategy = pgTable("strategy", {
  strategyId: varchar("strategy_id", { length: 100 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: varchar("description"),
  className: varchar("class_name", { length: 100 }).notNull(),
  config: jsonb("config").notNull(),
  isEnabled: boolean("is_enabled").default(false),
  executionMode: executionModeEnum("execution_mode").notNull().default("PAPER"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Position table
export const position = pgTable("position", {
  positionId: uuid("position_id").primaryKey().defaultRandom(),
  strategyId: varchar("strategy_id", { length: 100 })
    .notNull()
    .references(() => strategy.strategyId),
  instrumentId: integer("instrument_id")
    .notNull()
    .references(() => instrument.instrumentId),
  quantity: integer("quantity").notNull(),
  averageEntryPrice: decimal("average_entry_price", {
    precision: 12,
    scale: 4,
  }).notNull(),
  currentPrice: decimal("current_price", { precision: 12, scale: 4 }),
  unrealizedPnl: decimal("unrealized_pnl", { precision: 12, scale: 2 }),
  realizedPnl: decimal("realized_pnl", { precision: 12, scale: 2 }).default(
    "0",
  ),
  stopLossPrice: decimal("stop_loss_price", { precision: 12, scale: 4 }),
  targetPrice: decimal("target_price", { precision: 12, scale: 4 }),
  status: positionStatusEnum("status").notNull().default("OPEN"),
  openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export type Strategy = typeof strategy.$inferSelect;
export type NewStrategy = typeof strategy.$inferInsert;
export type Position = typeof position.$inferSelect;
export type NewPosition = typeof position.$inferInsert;
