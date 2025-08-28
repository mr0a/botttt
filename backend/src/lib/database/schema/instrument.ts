import {
  pgTable,
  integer,
  varchar,
  boolean,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { instrumentTypeEnum, exchangeEnum } from "./enum";

// Instrument table
export const instrument = pgTable("instrument", {
  instrumentId: integer("instrument_id").primaryKey(),
  symbol: varchar("symbol", { length: 50 }).notNull().unique(),
  exchange: exchangeEnum("exchange").notNull(),
  instrumentType: instrumentTypeEnum("instrument_type").notNull(),
  isActive: boolean("is_active").default(true),
  listingDate: date("listing_date"),
  delistingDate: date("delisting_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Instrument = typeof instrument.$inferSelect;
export type NewInstrument = typeof instrument.$inferInsert;
