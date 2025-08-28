import {
  pgTable,
  serial,
  varchar,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

// Broker credentials table
export const brokerCredentials = pgTable("broker_credentials", {
  id: serial("id").primaryKey(),
  brokerName: varchar("broker_name", { length: 50 }).notNull(),
  encryptedApiKey: varchar("encrypted_api_key").notNull(), // Using varchar instead of bytea for simplicity
  encryptedSecret: varchar("encrypted_secret").notNull(), // Using varchar instead of bytea for simplicity
  encryptionKeyId: varchar("encryption_key_id", { length: 50 }).notNull(),
  config: jsonb("config").notNull().default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type BrokerCredentials = typeof brokerCredentials.$inferSelect;
export type NewBrokerCredentials = typeof brokerCredentials.$inferInsert;
