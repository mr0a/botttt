import {
  pgTable,
  serial,
  integer,
  varchar,
  bigint,
  decimal,
  timestamp,
  date,
  text,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { instrument } from "./instrument";

// Stock table
export const stock = pgTable("stock", {
  stockId: serial("stock_id").primaryKey(),
  instrumentId: integer("instrument_id")
    .notNull()
    .references(() => instrument.instrumentId)
    .unique(),
  isin: varchar("isin", { length: 12 }),
  sector: varchar("sector", { length: 100 }),
  industry: varchar("industry", { length: 100 }),
  marketCap: bigint("market_cap", { mode: "number" }),
  faceValue: decimal("face_value", { precision: 10, scale: 2 }),
  lotSize: integer("lot_size"),
  tickSize: decimal("tick_size", { precision: 10, scale: 4 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Index table
export const index = pgTable("index", {
  indexId: serial("index_id").primaryKey(),
  instrumentId: integer("instrument_id")
    .notNull()
    .references(() => instrument.instrumentId)
    .unique(),
  indexType: varchar("index_type", { length: 50 }),
  baseYear: integer("base_year"),
  baseValue: decimal("base_value", { precision: 12, scale: 4 }),
  constituentsCount: integer("constituents_count"),
  methodology: text("methodology"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Option table
export const option = pgTable(
  "option",
  {
    optionId: serial("option_id").primaryKey(),
    instrumentId: integer("instrument_id")
      .notNull()
      .references(() => instrument.instrumentId)
      .unique(),
    underlyingInstrumentId: integer("underlying_instrument_id")
      .notNull()
      .references(() => instrument.instrumentId),
    optionType: varchar("option_type", { length: 4 }).notNull(),
    strikePrice: decimal("strike_price", { precision: 12, scale: 4 }).notNull(),
    expiryDate: date("expiry_date").notNull(),
    lotSize: integer("lot_size").notNull(),
    tickSize: decimal("tick_size", { precision: 10, scale: 4 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check("option_type_check", sql`${table.optionType} IN ('CALL', 'PUT')`),
  ],
);

// Future table
export const future = pgTable("future", {
  futureId: serial("future_id").primaryKey(),
  instrumentId: integer("instrument_id")
    .notNull()
    .references(() => instrument.instrumentId)
    .unique(),
  underlyingInstrumentId: integer("underlying_instrument_id").references(
    () => instrument.instrumentId,
  ),
  expiryDate: date("expiry_date").notNull(),
  lotSize: integer("lot_size").notNull(),
  tickSize: decimal("tick_size", { precision: 10, scale: 4 }),
  marginPercentage: decimal("margin_percentage", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Index constituent table
export const indexConstituent = pgTable(
  "index_constituent",
  {
    indexConstituentId: serial("index_constituent_id").primaryKey(),
    indexInstrumentId: integer("index_instrument_id")
      .notNull()
      .references(() => instrument.instrumentId),
    constituentInstrumentId: integer("constituent_instrument_id")
      .notNull()
      .references(() => instrument.instrumentId),
    weightage: decimal("weightage", { precision: 8, scale: 4 }).notNull(),
    sharesOutstanding: bigint("shares_outstanding", { mode: "number" }),
    effectiveDate: date("effective_date").notNull(),
    endDate: date("end_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      "valid_date_range",
      sql`${table.endDate} IS NULL OR ${table.endDate} >= ${table.effectiveDate}`,
    ),
    check(
      "valid_weightage",
      sql`${table.weightage} >= 0 AND ${table.weightage} <= 100`,
    ),
  ],
);

export type Stock = typeof stock.$inferSelect;
export type NewStock = typeof stock.$inferInsert;
export type Index = typeof index.$inferSelect;
export type NewIndex = typeof index.$inferInsert;
export type Option = typeof option.$inferSelect;
export type NewOption = typeof option.$inferInsert;
export type Future = typeof future.$inferSelect;
export type NewFuture = typeof future.$inferInsert;
export type IndexConstituent = typeof indexConstituent.$inferSelect;
export type NewIndexConstituent = typeof indexConstituent.$inferInsert;
