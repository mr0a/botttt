import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/database/schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/tradebot",
  },
  migrations: {
    table: "__drizzle_migrations__",
  },
});
